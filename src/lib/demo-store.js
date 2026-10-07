// In-memory fallback store when database is unreachable (starts empty, only holds real user posts)
const initialPosts = [];

let fallbackPosts = [...initialPosts];

export const DemoStore = {
  getPosts: () => [...fallbackPosts],
  addPost: (post) => {
    const newPost = {
      id: "post-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
      status: "scheduled",
      ...post,
    };
    fallbackPosts.unshift(newPost);
    return newPost;
  },
  updatePost: (id, data) => {
    const idx = fallbackPosts.findIndex(p => p.id === id);
    if (idx !== -1) {
      fallbackPosts[idx] = { ...fallbackPosts[idx], ...data };
      return fallbackPosts[idx];
    }
    return null;
  },
  deletePost: (id) => {
    fallbackPosts = fallbackPosts.filter(p => p.id !== id);
    return true;
  }
};
