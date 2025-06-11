const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('login');
});
router.get('/register', (req, res) => {
    res.render('index');
});
router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

router.get('/profile', (req, res) => {
    res.render('profile');
});

router.get('/all-users', (req, res) => {
    res.render('all-users');
});

router.get('/uploads', (req, res) => {
    res.render('uploads');
});

// Admin pages
router.get('/admin/login', (req, res) => {
    res.render('admin-login');
});

router.get('/admin/dashboard', (req, res) => {
    res.render('admin-dashboard');
});

router.get('/admin/users', (req, res) => {
    res.render('admin-users');
});

router.get('/admin/posts', (req, res) => {
    res.render('admin-posts');
});

router.get('/admin/users/:userId', (req, res) => {
    res.render('admin-user-detail');
});

router.get('/admin/posts/:postId', (req, res) => {
    res.render('admin-post-detail');
});

module.exports = router;
