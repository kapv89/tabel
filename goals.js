import express from 'express';
import {table} from 'app/orm';
import {Scoper, Validator, Action, Transformer, Resource, Operation} from 'app/orm';

const app = express();

const reviewsResource = new Resource({
  list: {
    validate(input) { return new Validator({input}); },
    process(validated) { return new Operation({validated}); },
    serialize(processed) { return new Transformer({processed}); }
  }
});

reviewsResource.on('before', () => {});
reviewsResource.on('after', () => {});
reviewsResource.on('before:validate', ([input]) => {});
reviewsResource.on('after:validate', ([input,validated]) => {});
reviewsResource.on('before:process', ([input, validated]) => {});
reviewsResource.on('after:process', ([input, validated, processed]) => {});
reviewsResource.on('before:serialize', ([input, validated, processed]) => {});
reviewsResource.on('after:serialize', ([input, validated, processed, serialized]) => {});

app.get('/reviews', async (req, res) => {
  try {
    const result = reviewsResource.action('list', {...req.query, ...req.params, user: req.user});
    res.send({result});
  } catch (errors) {
    res.status(400).send({errors});
  }
});

app.post('/reviews', async (req, res) => {
  try {
    const result = reviewsResource.action('create', {...req.body, user: req.user});
    res.send({result});
  } catch (errors) {
    res.status(400).send({errors});
  }
});

export default app;
