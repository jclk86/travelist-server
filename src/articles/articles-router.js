const express = require("express");
const ArticlesService = require("./articles-service");
const articlesRouter = express.Router();
const bodyParser = express.json();
const { requireAuth } = require("../middleware/jwt-auth");

articlesRouter
  .route("/")
  .get((req, res, next) => {
    ArticlesService.getAllArticles(req.app.get("db"))
      .then(articles => {
        res.json(articles.map(ArticlesService.serializeArticle));
      })
      .catch(next);
  })

  .post(requireAuth, bodyParser, (req, res, next) => {
    // add require auth before bodyParser
    const { id } = req.user;
    // title, style, author_id, content;
    const {
      // add image
      title,
      content,
      article_tag
    } = req.body;
    const newArticle = {
      author_id: id,
      title,
      content,
      article_tag: article_tag
    };

    console.log(newArticle);
    for (const [key, value] of Object.entries(newArticle))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        });
    ArticlesService.addArticle(req.app.get("db"), newArticle)
      .then(article => {
        res
          .status(201)
          .location(req.originalUrl, `/${article.id}`)
          .json(article);
      })
      .catch(next);
  });

articlesRouter
  .route("/:article_id")
  // .all(requireAuth)
  .all(checkArticleExists)
  .get((req, res, next) => {
    res.json(ArticlesService.serializeArticle(res.article));
  })
  .patch(requireAuth, bodyParser, (req, res, next) => {
    // if user id = author_id, then can edit
    // and need article id from req.params
    // OR conditionally render the buttons to do this on items - user Id and/or author_id must be in state
    //  const { id } = req.user;
    //  const { author_id } = req.body;
    //  id===author_id?

    const { article_id } = req.params;
    // add date_modified to article? It's on user for some reason
    const { title, content, article_tag } = req.body;

    const articleToUpdate = {
      title,
      content,
      article_tag,
      id: article_id,
      author_id: req.user.id
    };

    const numOfValues = Object.values(articleToUpdate).filter(Boolean).length;

    if (numOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request must contain either 'title', 'content', 'article_tag', 'author_id'`
        }
      });
    }
    ArticlesService.updateArticle(
      req.app.get("db"),
      article_id,
      articleToUpdate
    )
      .then(numOfRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
  .delete(requireAuth, (req, res, next) => {
    const { article_id } = req.params;
    ArticlesService.deleteArticle(req.app.get("db"), article_id)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });
articlesRouter
  .route("/:article_id/comments/")
  // add requireAuth
  .all(checkArticleExists)
  .get((req, res, next) => {
    ArticlesService.getCommentsForArticle(
      req.app.get("db"),
      req.params.article_id
    )
      .then(comments => {
        res.json(
          comments.map(comment =>
            ArticlesService.serializeArticleComment(comment)
          )
        );
      })
      .catch(next);
  });

async function checkArticleExists(req, res, next) {
  try {
    const article = await ArticlesService.getById(
      req.app.get("db"),
      req.params.article_id
    );
    if (!article)
      return res.status(404).json({
        error: `Article doesn't exist`
      });
    res.article = article;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = articlesRouter;
