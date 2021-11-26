import { GetStaticProps } from 'next';
import Link from 'next/link';

import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { formateResultsPosts } from '../utils/formatedResultsPosts';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination);

  async function handleMorePosts(): Promise<void> {
    const nextPost: ApiSearchResponse = await fetch(posts.next_page).then(
      data => data.json()
    );

    const newPost = formateResultsPosts(nextPost.results);

    setPosts(prevState => ({
      next_page: nextPost.next_page,
      results: [...prevState.results, ...newPost],
    }));
  }

  return (
    <>
      <main className={styles.container}>
        <div className={`${styles.postsContent} ${commonStyles.wd_700_center}`}>
          <img src="/logo.svg" alt="logo" />

          {posts.results.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h2>{post.data.title}</h2>
                <p>{post.data.subtitle}</p>
                <div>
                  <time>
                    <FiCalendar color="#bbbbbb" size={20} />
                    {format(new Date(post.first_publication_date), 'PP', {
                      locale: ptBR,
                    })}
                  </time>
                  <span>
                    <FiUser color="#bbbbbb" size={20} /> {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}

          {posts.next_page ? (
            <button onClick={handleMorePosts} type="button">
              Carregar mais posts
            </button>
          ) : null}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 2,
    }
  );

  const posts = formateResultsPosts(postsResponse.results);

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: { postsPagination },
    revalidate: 60 * 30,
  };
};
