import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
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

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

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

            {post.data.content.map((postContent, index) => {
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

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();

  const { slug } = context.params;

  const res = await prismic.getByUID('posts', String(slug), {});

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

  return {
    props: { post },
    revalidate: 30 * 60,
  };
};
