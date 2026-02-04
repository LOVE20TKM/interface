import { useState, useEffect } from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

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

// 为组件添加类型
export default function ArticleList({ articles }: { articles: Article[] }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">LOVE20 协议相关文章</h1>
      <div className="grid gap-6">
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
}
