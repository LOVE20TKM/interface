import { useState, useEffect } from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

// 定义前置元数据接口
interface FrontMatter {
  title: string;
  date?: string;
  description?: string;
  [key: string]: any;
}

// 定义参数接口
interface Params {
  params: {
    slug: string;
  };
}

export async function getStaticPaths() {
  const articlesDirectory = path.join(process.cwd(), 'public/articles');
  const filenames = fs.readdirSync(articlesDirectory);

  const paths = filenames.map((filename) => ({
    params: {
      slug: filename.replace('.md', ''),
    },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }: Params) {
  const articlesDirectory = path.join(process.cwd(), 'public/articles');
  const filePath = path.join(articlesDirectory, `${params.slug}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');

  const { data, content } = matter(fileContents);
  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight],
    },
    scope: data,
  });

  return {
    props: {
      source: mdxSource,
      frontMatter: data,
    },
  };
}

export default function Article({
  source,
  frontMatter,
}: {
  source: MDXRemoteSerializeResult;
  frontMatter: FrontMatter;
}) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <article className="prose lg:prose-xl mx-auto">
        <h1>{frontMatter.title}</h1>
        {frontMatter.date && <p className="text-gray-500">{new Date(frontMatter.date).toLocaleDateString()}</p>}
        <div className="mt-8">
          <MDXRemote {...source} />
        </div>
      </article>
    </div>
  );
}
