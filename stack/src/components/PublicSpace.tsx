import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import { useRouter } from "next/router";

interface Post {
  id: number;
  content: string;
  media: string[];
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  comments: Array<{
    id: number;
    content: string;
    user: {
      id: number;
      name: string;
    };
  }>;
  likes: Array<{
    id: number;
    user: {
      id: number;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

const PublicSpace: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/posts/feed?page=${page}&limit=10`);
        if (res.data.success) {
          setPosts(res.data.posts || []);
          setTotalPages(res.data.pagination?.totalPages || 1);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [page]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  if (loading && posts.length === 0) {
    return (
      <Mainlayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-xl lg:text-2xl font-semibold">Public Space</h1>
          <button
            onClick={() => router.push("/ask")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap"
          >
            Ask Question
          </button>
        </div>

        {posts.length === 0 && !loading ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No posts found. Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <Link href={`/users/${post.userId}`} className="flex-shrink-0">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {post.user?.name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        href={`/users/${post.userId}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        {post.user?.name || 'Unknown User'}
                      </Link>
                      <span className="text-gray-500 text-xs">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-gray-800 mb-3 whitespace-pre-wrap break-words">
                      {post.content}
                    </p>

                    {post.media && post.media.length > 0 && (
                      <div className="mb-3 grid grid-cols-2 gap-2">
                        {post.media.map((mediaUrl, index) => (
                          <img
                            key={index}
                            src={mediaUrl}
                            alt={`Post media ${index + 1}`}
                            className="w-full h-48 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <button className="flex items-center gap-1 hover:text-blue-600">
                        <span>👍</span>
                        <span>{post.likes?.length || 0}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-600">
                        <span>💬</span>
                        <span>{post.comments?.length || 0} comments</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-600">
                        <span>🔄</span>
                        <span>Share</span>
                      </button>
                    </div>

                    {post.comments && post.comments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="space-y-2">
                          {post.comments.slice(0, 3).map((comment) => (
                            <div key={comment.id} className="text-sm">
                              <span className="font-medium text-blue-600">
                                {comment.user?.name || 'Unknown'}
                              </span>
                              <span className="text-gray-700 ml-2">
                                {comment.content}
                              </span>
                            </div>
                          ))}
                          {post.comments.length > 3 && (
                            <button className="text-blue-600 text-sm hover:underline">
                              View all {post.comments.length} comments
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Mainlayout>
  );
};

export default PublicSpace;

