const express = require('express');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getMyProjects,
  getRecommended,
  fillRole,
  setYoutubeLink,
  getAllFilms,
  getUserFilms,
  removeMember,
  leaveProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/*
 * IMPORTANT: Static string routes (/my, /recommended) MUST be declared
 * before the dynamic /:id route, otherwise Express matches them as IDs.
 */
router.get('/my',                  protect, getMyProjects);
router.get('/recommended',         protect, getRecommended);
router.get('/films',               getAllFilms);                // public – global films browse
router.get('/films/:userId',        getUserFilms);               // public – used on profiles
router.patch('/:id/roles/fill',         protect, fillRole);
router.patch('/:id/youtube-link',       protect, setYoutubeLink);
router.delete('/:id/members/:userId',   protect, removeMember);
router.delete('/:id/leave',             protect, leaveProject);
router.get('/',            getProjects);
router.get('/:id',         getProject);
router.post('/',           protect, createProject);
router.put('/:id',         protect, updateProject);
router.delete('/:id',      protect, deleteProject);

module.exports = router;
