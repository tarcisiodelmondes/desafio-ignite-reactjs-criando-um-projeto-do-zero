import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';

import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { PreviewResponse } from '@prismicio/client/types/ResolvedApi';
import Link from 'next/link';
import Header from '../../components/Header';

import { useUpdatePreview } from '../../utils/useUpdatePreviewRef';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { UtterancesComments } from '../../components/UtterancesComments';
import { ButtonExitPreview } from '../../components/ButtonExitPreview';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface AfterAndBeforePostProps {
  title: string;
  uid: string;
}

interface PostProps {
  post: Post;
  previewRef: PreviewResponse;
  preview: boolean;
  postEditedDate?: string;
  beforePost: AfterAndBeforePostProps | null;
  afterPost: AfterAndBeforePostProps | null;
}

export default function Post({
  post,
  previewRef,
  preview,
  postEditedDate,
  beforePost,
  afterPost,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  if (!post.uid) {
    return <h1>Not Found</h1>;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useUpdatePreview(previewRef, post.uid);

  function calculateEstimateReadTime(): number {
    const allTextInHtml = post.data.content.reduce((acc, postContent) => {
      return acc + RichText.asText(postContent.body) + postContent?.heading;
    }, '');

    const estimated = Math.ceil(allTextInHtml.split(/\s+/).length / 200);

    return estimated;
  }
  return (
    <>
      <Header />

      <main className={styles.container}>
        <img className={styles.banner} src={post.data.banner.url} alt="" />

        <article
          className={`${styles.postContainer} ${commonStyles.wd_700_center}`}
        >
          <div className={styles.postContent}>
            <h1>{post.data.title}</h1>

            <div className={styles.postInfo}>
              <span>
                <FiCalendar color="#BBBBBB" size={20} />
                {format(new Date(post.first_publication_date), 'PP', {
                  locale: ptBR,
                })}
              </span>

              <span>
                <FiUser color="#BBBBBB" size={20} /> {post.data.author}
              </span>
              <span>
                <FiClock color="#BBBBBB" size={20} />
                {calculateEstimateReadTime()} min
              </span>
            </div>

            {postEditedDate ? (
              <p className={styles.edit}>
                * editado em{' '}
                {format(new Date(postEditedDate), "PP, 'às' p", {
                  locale: ptBR,
                })}
              </p>
            ) : null}

            {post.data.content.map(postContent => {
              return (
                <div className={styles.postBody} key={postContent.heading}>
                  <h2>{postContent.heading}</h2>

                  <div
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(postContent.body),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </article>
      </main>

      <footer className={`${styles.footer} ${commonStyles.wd_700_center}`}>
        <div className={styles.afterAndBeforePost}>
          {beforePost ? (
            <Link href={`/post/${beforePost.uid}`}>
              <a>
                <p>{beforePost.title}</p>

                <span>Post anterior</span>
              </a>
            </Link>
          ) : null}

          {afterPost ? (
            <Link href={`/post/${afterPost.uid}`}>
              <a>
                <p> {afterPost.title}</p>

                <span>Próximo post</span>
              </a>
            </Link>
          ) : null}
        </div>

        <UtterancesComments />
        {preview && <ButtonExitPreview />}
      </footer>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.slug'],
      pageSize: 2,
    }
  );

  const params = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: params,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  previewData,
  params,
  preview = false,
}) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const previewRef = previewData ? previewData.ref : null;
  const refOption = previewRef ? { ref: previewRef } : null;

  const res = await prismic.getByUID('posts', String(slug), refOption || {});
  const post = {
    first_publication_date: res.first_publication_date,
    uid: res.uid,
    data: {
      title: res.data.title,
      subtitle: res.data.subtitle,
      banner: {
        url: res.data.banner.url,
      },
      author: res.data.author,
      content: res.data.content.map(postContent => {
        return {
          heading: postContent.heading,
          body: postContent.body,
        };
      }),
    },
  };

  const beforePostResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title'],
      after: res.id,
      orderings: '[document.first_publication_date desc]',
      pageSize: 1,
    }
  );

  const afterPostResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title'],
      after: res.id,
      orderings: '[document.first_publication_date]',
      pageSize: 1,
    }
  );

  const beforePost =
    beforePostResponse.results.length > 0
      ? {
          title: beforePostResponse.results[0].data?.title,
          uid: beforePostResponse.results[0]?.uid,
        }
      : null;

  const afterPost =
    afterPostResponse.results.length > 0
      ? {
          title: afterPostResponse.results[0].data?.title,
          uid: afterPostResponse.results[0]?.uid,
        }
      : null;

  const postEditedDate =
    res.first_publication_date !== res.last_publication_date
      ? res.last_publication_date
      : null;

  return {
    props: {
      post,
      previewRef,
      preview,
      postEditedDate,
      beforePost,
      afterPost,
    },
    revalidate: 30 * 60,
  };
};
