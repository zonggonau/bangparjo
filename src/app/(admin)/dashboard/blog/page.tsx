'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminBlogPostsAction, saveAdminBlogPostAction, deleteAdminBlogPostAction, sendBlogBroadcastAction } from '@/lib/actions-admin-content';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published: boolean;
  author: string;
  createdAt: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  
  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image: '',
    author: 'Admin',
    published: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadPosts = () => {
    setLoading(true);
    getAdminBlogPostsAction()
      .then(data => {
        if (data.success) {
          setPosts((data.data as any[]) || []);
          setCurrentPage(1); // reset page on load
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPosts(); }, []);

  const totalPages = Math.ceil(posts.length / itemsPerPage);
  const paginatedPosts = posts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetForm = () => {
    setForm({ title: '', slug: '', excerpt: '', content: '', image: '', author: 'Admin', published: false });
    setEditing(null);
    setShowForm(false);
    setMessage('');
  };

  const editPost = (post: BlogPost) => {
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: '',
      image: '',
      author: post.author,
      published: post.published,
    });
    setEditing(post);
    setShowForm(true);
    setMessage('');

    // Fetch full content
    getAdminBlogPostsAction(post.id)
      .then(data => {
        if (data.success) {
          const d = data.data as any;
          setForm(prev => ({
            ...prev,
            content: d.content || '',
            image: d.image || '',
          }));
        }
      })
      .catch(console.error);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const body = editing
        ? { id: editing.id, ...form }
        : form;

      const data = await saveAdminBlogPostAction(body);

      if (data.success) {
        setMessage(editing ? '✅ Post updated!' : '✅ Post created!');
        resetForm();
        loadPosts();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      const data = await deleteAdminBlogPostAction(id);
      if (data.success) {
        loadPosts();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      const data = await saveAdminBlogPostAction({ id: post.id, published: !post.published });
      if (data.success) loadPosts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Blog Posts</h1>
          <p className="text-sm text-gray-500">Manage your blog content</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#e55e00] transition-colors cursor-pointer border-none"
        >
          {showForm ? '✕ Cancel' : '+ New Post'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {editing ? '✏️ Edit Post' : '📝 New Post'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => {
                  setForm({ ...form, title: e.target.value });
                  if (!editing) setForm(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={e => setForm({ ...form, excerpt: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none"
              placeholder="Short description for the blog listing..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML) *</label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              rows={12}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none"
              required
              placeholder="<h2>Your article content here...</h2><p>Supports HTML</p>"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="text"
                value={form.image}
                onChange={e => setForm({ ...form, image: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <input
                type="text"
                value={form.author}
                onChange={e => setForm({ ...form, author: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={e => setForm({ ...form, published: e.target.checked })}
                className="w-4 h-4 text-[#FF6B00] focus:ring-[#FF6B00] rounded"
              />
              <span className="text-sm text-gray-700">Publish immediately</span>
            </label>
          </div>

          {message && (
            <div className="mb-4 text-sm font-medium">{message}</div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#FF6B00] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#e55e00] transition-colors disabled:opacity-50 border-none cursor-pointer"
            >
              {saving ? 'Saving...' : editing ? '✏️ Update Post' : '📝 Create Post'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2.5 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Posts List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-200 p-5">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">No posts yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create your first blog post!</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#e55e00] transition-colors cursor-pointer border-none"
          >
            + New Post
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedPosts.map(post => (
            <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-800 truncate">{post.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  /{post.slug} · By {post.author} · {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button
                  onClick={() => togglePublish(post)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer border-none ${
                    post.published
                      ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {post.published ? 'Unpublish' : 'Publish'}
                </button>
                
                {/* Broadcast Email Button */}
                <button
                  onClick={() => {
                    setSelectedPost(post);
                    setBroadcastMessage('');
                    setShowBroadcastModal(true);
                  }}
                  title="Broadcast this article to all customers/subscribers"
                  className="text-xs px-3 py-1.5 rounded-lg font-medium bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-colors border-none cursor-pointer flex items-center gap-1"
                >
                  <i className="fas fa-envelope"></i> Broadcast
                </button>

                <button
                  onClick={() => editPost(post)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border-none cursor-pointer"
                >
                  Edit
                </button>
                <a
                  href={`/${post.slug}`}
                  target="_blank"
                  className="text-xs px-3 py-1.5 rounded-lg font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors no-underline"
                >
                  View
                </a>
                <button
                  onClick={() => deletePost(post.id)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors border-none cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 mt-6">
              <span className="text-sm text-gray-500 font-medium">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, posts.length)} of {posts.length} posts
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors cursor-pointer border-none ${
                        currentPage === idx + 1
                          ? 'bg-[#FF6B00] text-white'
                          : 'text-gray-600 hover:bg-gray-100 bg-white'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Broadcast Blog Post Modal */}
      {showBroadcastModal && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] max-w-[500px] w-full p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                <i className="fas fa-paper-plane text-[#FF6B00]"></i>
                Broadcast Blog Post
              </h3>
              <button 
                onClick={() => { setShowBroadcastModal(false); setSelectedPost(null); }}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 border-none cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <p className="text-xs font-semibold text-gray-500 mb-6 leading-relaxed">
              This action will broadcast the link of <strong>"{selectedPost.title}"</strong> to all customers and newsletter subscribers. You can add an optional custom message below.
            </p>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs text-gray-600 mb-5">
              <strong className="text-gray-700">Email Subject:</strong> New Article: {selectedPost.title} - BangParjo Shop<br/>
              <strong className="text-gray-700">Tautan Artikel:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/${selectedPost.slug}` : `/${selectedPost.slug}`}
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setBroadcasting(true);
              try {
                const absoluteUrl = `${window.location.origin}/${selectedPost.slug}`;
                const res = await sendBlogBroadcastAction(selectedPost.title, absoluteUrl, broadcastMessage);
                if (res.success) {
                  alert(res.message || 'Broadcast sent successfully!');
                  setShowBroadcastModal(false);
                  setSelectedPost(null);
                } else {
                  alert(res.error || 'Failed to send broadcast.');
                }
              } catch (err: any) {
                alert(err.message || 'An error occurred.');
              } finally {
                setBroadcasting(false);
              }
            }} className="flex flex-col gap-5">
              <div>
                <label className="block font-black text-xs uppercase text-gray-500 tracking-[0.05em] mb-2">Optional Opening Message</label>
                <textarea 
                  rows={4}
                  placeholder="Hey dropshippers, check out our latest guide to boost your stores..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-[12px] border border-gray-200 text-sm outline-none focus:border-[#FF6B00] transition-all duration-200 resize-none font-sans"
                  disabled={broadcasting}
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button 
                  type="button"
                  onClick={() => { setShowBroadcastModal(false); setSelectedPost(null); }}
                  className="px-5 py-3 rounded-[12px] text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200 cursor-pointer bg-white"
                  disabled={broadcasting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 rounded-[12px] text-sm font-black bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 flex items-center gap-2 disabled:opacity-50 border-none cursor-pointer"
                  disabled={broadcasting}
                >
                  {broadcasting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Send Broadcast
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
