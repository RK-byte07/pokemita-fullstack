const express = require('express');
const router = express.Router();

const controller = require(
  '../controllers/battle.controller',
);

const teams = require(
  '../services/simulator-teams',
);

router.get(
  '/simulator/catalog',
  (req, res) => {
    res.json({
      pokemon: teams.catalog,
      ...teams.options,
    });
  },
);

router.get(
  '/simulator/random-team',
  (req, res, next) => {
    try {
      res.json(
        teams.randomTeam(),
      );
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/simulator/validate',
  (req, res) => {
    res.json(
      teams.validate(
        req.body.team,
      ),
    );
  },
);

router.get(
  '/simulator/pokemon/:name',
  (req, res, next) => {
    try {
      const data = teams.editor(
        req.params.name,
      );

      if (!data) {
        return res.status(404).json({
          error:
            'Especie no disponible en OU.',
        });
      }

      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/battle',
  controller.autoBattle,
);

router.post(
  '/manual/start',
  controller.manualStart,
);

router.post(
  '/manual/action',
  controller.manualAction,
);

module.exports = router;