const express = require('express');
const router = express.Router();

const stepService = require('./step.service');

router.put('/url', (req, res) => {
  stepService.scrapeContent(req, res);
});

router.get('/steps', (req, res) => {
  stepService.getSteps(req, res);
});

router.post('/step', (req, res) => {
  stepService.postStep(req, res);
});

router.delete('/step/:uid', (req, res) => {
  stepService.deleteStep(req, res);
});

router.put('/path/:uid', (req, res) => {
  stepService.savePath(req, res);
});

router.delete('/path/:uid', (req, res) => {
  stepService.deletePath(req, res);
});

router.put('/thumb/:uid', (req, res) => {
  stepService.uploadThumb(req, res);
});

module.exports = router;
