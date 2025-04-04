'use client';

import type { NextPage } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import LeftTitle from '@/src/components/Common/LeftTitle';

// 定义文章项的接口
interface Article {
  slug: string;
  title: string;
  date: string | null;
  description: string;
}

export async function getStaticProps() {
  const articlesDirectory = path.join(process.cwd(), 'public/articles');
  const filenames = fs.readdirSync(articlesDirectory);

  const articles = filenames.map((filename) => {
    const filePath = path.join(articlesDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    return {
      slug: filename.replace('.md', ''),
      title: data.title || filename,
      date: data.date || null,
      description: data.description || '',
    };
  });

  return {
    props: {
      articles: articles.sort((a, b) => (a.date > b.date ? -1 : 1)),
    },
  };
}

const Home: NextPage<{ articles: Article[] }> = ({ articles }) => {
  // useEffect(() => {
  //   if (!token || hasRedirected) {
  //     return;
  //   }

  //   const symbol = token.symbol;
  //   if (symbol) {
  //     setHasRedirected(true);
  //     const target = token.hasEnded ? `/acting/?symbol=${symbol}` : `/launch/?symbol=${symbol}`;
  //     router.push(target).catch((err) => {
  //       console.log('路由跳转被取消或出错：', err);
  //     });
  //   }
  // }, [token, router, hasRedirected]);

  return (
    <div className="container mx-auto px-4 py-8">
      <LeftTitle title="LOVE20 测试声明" />
      <div className="grid gap-6">
        <div className="p-6">
          <p className="text-gray-700">
            LOVE20 是一个实验，旨在帮助社群铸造真正属于自己社群的代币，也让社群成员享受社群发展带来的经济价值。
          </p>
          <p className="text-gray-700 mt-2 text-red-500">不鼓励大家将之作为投机工具，请大家注意风险，谨慎投资。</p>

          <div className="w-full text-center my-4">
            <Button variant="outline" size="sm" className="mt-2 w-1/2 text-secondary border-secondary" asChild>
              <Link href={`/acting/`}>进入社群首页</Link>
            </Button>
          </div>
        </div>
      </div>
      <LeftTitle title="LOVE20 介绍文章" />
      <div className="grid gap-6 mt-4">
        {articles.map((article: Article) => (
          <Link
            href={`/articles/${article.slug}`}
            key={article.slug}
            className="block p-6 border rounded-lg hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
            {article.date && (
              <p className="text-sm text-gray-500 mb-2">{new Date(article.date).toLocaleDateString()}</p>
            )}
            {article.description && <p className="text-gray-700">{article.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
