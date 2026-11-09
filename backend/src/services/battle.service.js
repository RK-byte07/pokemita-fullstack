const { Battle } = require('pokemon-showdown');
const { randomUUID } = require('node:crypto');

const teams = require('./simulator-teams');

const {
  inventory,
  checkItem,
  bagFormat,
} = require('./simulator-bag');

function decide(battle, side) {
  const request = side.activeRequest;

  if (!request || request.wait) {
    return null;
  }

  if (request.teamPreview) {
    return `team ${side.pokemon
      .map((_, index) => index + 1)
      .join('')}`;
  }

  if (request.forceSwitch) {
    return 'default';
  }

  const actor = side.active[0];
  const foe = side.foe.active[0];

  const recovery = new Set([
    'recover',
    'roost',
    'slackoff',
    'softboiled',
    'synthesis',
    'moonlight',
    'morningsun',
    'shoreup',
  ]);

  const moves = request.active[0].moves
    .map((move, index) => ({
      ...move,
      index: index + 1,
    }))
    .filter(
      move =>
        !move.disabled &&
        move.pp !== 0,
    );

  const heal = moves.find(move =>
    recovery.has(move.id),
  );

  if (
    heal &&
    actor.hp / actor.maxhp < 0.4
  ) {
    return `move ${heal.index}`;
  }

  function score(candidate) {
    const move = battle.dex.moves.get(
      candidate.id,
    );

    if (move.category === 'Status') {
      return 0;
    }

    const types =
      foe?.illusion && !foe.terastallized
        ? foe.illusion.species.types
        : foe?.getTypes() || [];

    const effectiveness =
      battle.dex.getImmunity(
        move.type,
        types,
      )
        ? 2 **
          battle.dex.getEffectiveness(
            move.type,
            types,
          )
        : 0;

    const attack =
      move.category === 'Physical'
        ? actor.getStat(
            'atk',
            false,
            true,
          )
        : actor.getStat(
            'spa',
            false,
            true,
          );

    return (
      (move.basePower || 60) *
      effectiveness *
      (actor.hasType(move.type) ? 1.5 : 1) *
      attack
    );
  }

  const ranked = moves
    .map(move => ({
      ...move,
      score: score(move),
    }))
    .sort((a, b) => b.score - a.score);

  let selected = ranked[0];

  const setup = moves.find(candidate => {
    const boosts = battle.dex.moves.get(
      candidate.id,
    ).boosts;

    return (
      boosts &&
      Object.entries(boosts).some(
        ([key, value]) =>
          value > 0 &&
          actor.boosts[key] < 2,
      )
    );
  });

  if (
    setup &&
    actor.hp / actor.maxhp > 0.65 &&
    battle.random(5) === 0
  ) {
    selected = setup;
  }

  if (!selected) return 'default';

  const tera =
    request.active[0].canTerastallize &&
    actor.hp / actor.maxhp < 0.5 &&
    selected.score > 0;

  return `move ${selected.index}${
    tera ? ' terastallize' : ''
  }`;
}

function perspective(lines, channel) {
  const output = [];

  for (
    let index = 0;
    index < lines.length;
    index++
  ) {
    if (
      lines[index].startsWith('|split|')
    ) {
      const owner =
        lines[index].slice(7);

      output.push(
        lines[
          index +
            (owner === channel ? 1 : 2)
        ],
      );

      index += 2;
    } else {
      output.push(lines[index]);
    }
  }

  return output.filter(Boolean);
}

class Session {
  constructor({
    mode = 'manual',
    rules = 'bag',
    team,
    teamText,
    seed,
    opponentTeam,
  } = {}) {
    if (
      !['manual', 'auto'].includes(mode) ||
      !['bag', 'strict'].includes(rules)
    ) {
      throw new Error(
        'Modo o reglas inválidos.',
      );
    }

    const checked = teams.validate(
      team ||
      teamText ||
      teams.randomTeam(),
    );

    if (checked.errors.length) {
      throw new Error(
        checked.errors.join('\n'),
      );
    }

    const checkedOpponent =
      teams.validate(
        opponentTeam ||
        teams.randomTeam(),
      );

    if (
      checkedOpponent.errors.length
    ) {
      throw new Error(
        checkedOpponent.errors.join('\n'),
      );
    }

    this.id = randomUUID();
    this.mode = mode;
    this.rules = rules;
    this.version = 0;
    this.position = 0;

    this.bags = {
      p1: inventory(),
      p2: inventory(),
    };

    this.bag = this.bags.p1;
    this.lastUsed = Date.now();

    this.battle = new Battle({
      formatid: 'gen9ou',
      format:
        rules === 'bag'
          ? bagFormat()
          : undefined,
      seed,
      p1: {
        name:
          mode === 'auto'
            ? 'IA azul'
            : 'Tú',
        team: checked.team,
      },
      p2: {
        name: 'IA roja',
        team: checkedOpponent.team,
      },
    });

    this.battle.pokemitaPending = {};
    this.battle.pokemitaQueued = {};

    this.initial = {
      team: checked.team,
      opponent: structuredClone(
        this.battle.p2.team,
      ),
      seed: this.battle.prngSeed,
    };

    this.history = [];

    if (mode === 'manual') {
      this.pump();
    }
  }

  chooseAI(side) {
    const actor = side.active[0];
    const bag = this.bags[side.id];

    if (
      this.rules === 'bag' &&
      side.requestState === 'move' &&
      actor?.hp > 0
    ) {
      let item;
      let target = actor;

      if (
        actor.status &&
        bag.fullheal.uses > 0 &&
        this.battle.random(3) === 0
      ) {
        item = 'fullheal';
      } else if (
        actor.hp / actor.maxhp < 0.35
      ) {
        item = [
          'hyperpotion',
          'superpotion',
          'potion',
          'maxpotion',
        ].find(
          id => bag[id].uses > 0,
        );
      } else if (
        bag.revive.uses > 0 &&
        actor.hp / actor.maxhp > 0.65
      ) {
        const fainted =
          side.pokemon.find(
            pokemon => pokemon.fainted,
          );

        if (fainted) {
          item = 'revive';
          target = fainted;
        }
      }

      if (item) {
        this.battle.pokemitaPending[
          side.id
        ] = checkItem(
          this.battle,
          side.id,
          bag,
          item,
          target.position,
        );

        if (
          this.battle.choose(
            side.id,
            'default',
          )
        ) {
          return;
        }

        delete this.battle
          .pokemitaPending[side.id];
      }
    }

    const action = decide(
      this.battle,
      side,
    );

    if (
      action &&
      !this.battle.choose(
        side.id,
        action,
      ) &&
      !this.battle.choose(
        side.id,
        'default',
      )
    ) {
      throw new Error(
        'La IA no pudo resolver su solicitud.',
      );
    }
  }

  pump() {
    for (
      let index = 0;
      index < 12 && !this.battle.ended;
      index++
    ) {
      const side = this.battle.p2;

      if (
        !side.activeRequest ||
        side.activeRequest.wait ||
        side.isChoiceDone()
      ) {
        break;
      }

      this.chooseAI(side);

      const player = this.battle.p1;

      if (
        player.activeRequest &&
        !player.activeRequest.wait &&
        !player.isChoiceDone()
      ) {
        break;
      }
    }
  }

  step() {
    if (
      this.mode !== 'auto' ||
      this.battle.ended
    ) {
      return;
    }

    for (const id of ['p1', 'p2']) {
      const side =
        this.battle.getSide(id);

      if (
        side.activeRequest &&
        !side.activeRequest.wait &&
        !side.isChoiceDone()
      ) {
        this.chooseAI(side);
      }
    }

    this.version++;

    if (
      this.battle.turn >= 800 &&
      !this.battle.ended
    ) {
      this.battle.add(
        'message',
        'Límite de seguridad de 800 turnos.',
      );

      this.battle.tie();
    }
  }

  act({
    action,
    version,
    item,
    target,
  }) {
    if (
      this.mode !== 'manual' ||
      this.battle.ended
    ) {
      throw new Error(
        'La batalla no acepta acciones.',
      );
    }

    if (version !== this.version) {
      throw new Error(
        'El turno cambió. Elige una acción de la solicitud actual.',
      );
    }

    const side = this.battle.p1;

    if (
      !side.activeRequest ||
      side.activeRequest.wait ||
      side.isChoiceDone()
    ) {
      throw new Error(
        'Espera la siguiente solicitud.',
      );
    }

    let choice = action;

    if (item) {
      if (this.rules !== 'bag') {
        throw new Error(
          'La mochila está desactivada en OU estricto.',
        );
      }

      this.battle.pokemitaPending.p1 =
        checkItem(
          this.battle,
          'p1',
          this.bag,
          item,
          target,
        );

      choice = 'default';
    } else if (
      typeof action !== 'string' ||
      !/^(move [1-4]( terastallize)?|switch [1-6]|team [1-6]{6})$/.test(
        action,
      )
    ) {
      throw new Error(
        'Acción no válida.',
      );
    }

    if (
      !this.battle.choose(
        'p1',
        choice,
      )
    ) {
      delete this.battle
        .pokemitaPending.p1;

      throw new Error(
        side.choice.error ||
        'Showdown rechazó la acción.',
      );
    }

    this.history.push({
      turn: this.battle.turn,
      action,
      item,
      target,
    });

    this.version++;
    this.lastUsed = Date.now();

    this.pump();
  }

  snapshot() {
    const battle = this.battle;

    const events = perspective(
      battle.log.slice(this.position),
      this.mode === 'manual'
        ? 'p1'
        : 'spectator',
    );

    this.position = battle.log.length;

    function view(pokemon, own = false) {
      const apparent =
        !own && pokemon.illusion
          ? pokemon.illusion.species
          : pokemon.species;

      return {
        name: apparent.name,
        sprite: apparent.spriteid,
        types:
          !own &&
          pokemon.illusion &&
          !pokemon.terastallized
            ? apparent.types
            : pokemon.getTypes(),
        hp: own
          ? pokemon.hp
          : Math.ceil(
              (
                pokemon.hp /
                pokemon.maxhp
              ) * 100,
            ),
        maxhp: own
          ? pokemon.maxhp
          : 100,
        exact: own,
        status:
          pokemon.status === 'fnt'
            ? ''
            : pokemon.status,
        fainted: pokemon.fainted,
        active: pokemon.isActive,
        boosts: {
          ...pokemon.boosts,
        },
        tera:
          pokemon.terastallized ||
          null,
      };
    }

    const request =
      battle.p1.activeRequest;

    let controls = null;

    if (
      this.mode === 'manual' &&
      !battle.ended &&
      request &&
      !request.wait &&
      !battle.p1.isChoiceDone()
    ) {
      const active =
        request.active?.[0];

      controls = {
        type: request.teamPreview
          ? 'preview'
          : request.forceSwitch
            ? 'switch'
            : 'move',
        trapped: Boolean(
          active?.trapped,
        ),
        tera:
          active?.canTerastallize ||
          null,
        reviving: Boolean(
          request.side?.pokemon.some(
            pokemon =>
              pokemon.reviving,
          ),
        ),
        moves:
          active?.moves.map(
            (move, index) => ({
              index: index + 1,
              name: move.move,
              id: move.id,
              pp: move.pp ?? null,
              maxpp:
                move.maxpp ?? null,
              disabled: Boolean(
                move.disabled ||
                move.pp === 0,
              ),
              type: battle.dex.moves.get(
                move.id,
              ).type,
              power: battle.dex.moves.get(
                move.id,
              ).basePower,
            }),
          ) || [],
      };
    }

    return {
      id: this.id,
      version: this.version,
      mode: this.mode,
      rules: this.rules,
      turn: battle.turn,
      done: battle.ended,
      winner: battle.winner || null,
      events,
      controls,

      p1: battle.p1.active[0]
        ? view(
            battle.p1.active[0],
            this.mode === 'manual',
          )
        : null,

      p2: battle.p2.active[0]
        ? view(battle.p2.active[0])
        : null,

      team: battle.p1.pokemon.map(
        (pokemon, slot) => ({
          ...view(
            pokemon,
            this.mode === 'manual',
          ),
          slot,
        }),
      ),

      opponent:
        battle.p2.pokemon.map(
          pokemon => ({
            name:
              pokemon.species.name,
            sprite:
              pokemon.species.spriteid,
            fainted: pokemon.fainted,
          }),
        ),

      bag:
        this.rules === 'bag'
          ? Object.fromEntries(
              Object.entries(
                this.bag,
              ).map(
                ([key, value]) => [
                  key,
                  {
                    ...value,
                    heal:
                      value.heal ===
                      Infinity
                        ? 'max'
                        : value.heal ??
                          null,
                  },
                ],
              ),
            )
          : {},

      field: {
        weather: battle.field.weather,
        terrain: battle.field.terrain,
        effects: Object.keys(
          battle.field.pseudoWeather,
        ),
        p1: Object.keys(
          battle.p1.sideConditions,
        ),
        p2: Object.keys(
          battle.p2.sideConditions,
        ),
      },
    };
  }

  destroy() {
    this.battle.destroy();
  }
}

module.exports = {
  Session,
  decide,
  perspective,
};