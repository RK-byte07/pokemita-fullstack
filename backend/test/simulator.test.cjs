const test = require('node:test');
const assert = require('node:assert/strict');

const {
  Battle,
  TeamValidator,
} = require('pokemon-showdown');

const {
  bagFormat,
  inventory,
  checkItem,
} = require('../src/services/simulator-bag');

const {
  Session,
  perspective,
} = require('../src/services/battle.service');

const teams = require(
  '../src/services/simulator-teams',
);

function fixture(t) {
  const battle = new Battle({
    formatid: 'gen9ou',
    format: bagFormat(),
    seed: [1, 2, 3, 4],
    p1: {
      name: 'P1',
      team: [
        {
          species: 'Garchomp',
          ability: 'Rough Skin',
          moves: ['Earthquake'],
        },
        {
          species: 'Pikachu',
          ability: 'Static',
          moves: ['Thunderbolt'],
        },
      ],
    },
    p2: {
      name: 'P2',
      team: [
        {
          species: 'Blissey',
          ability: 'Natural Cure',
          moves: ['Soft-Boiled'],
        },
        {
          species: 'Corviknight',
          ability: 'Pressure',
          moves: ['Roost'],
        },
      ],
    },
  });

  battle.pokemitaPending = {};
  battle.pokemitaQueued = {};

  battle.makeChoices(
    'team 12',
    'team 12',
  );

  t.after(() => battle.destroy());

  return battle;
}

function itemTurn(
  battle,
  bag,
  id,
  target = 0,
) {
  battle.pokemitaPending.p1 =
    checkItem(
      battle,
      'p1',
      bag,
      id,
      target,
    );

  assert(
    battle.choose(
      'p1',
      'default',
    ),
  );

  assert(
    battle.choose(
      'p2',
      'move 1',
    ),
  );
}

test(
  '50 equipos aleatorios cumplen las reglas OU',
  () => {
    for (
      let index = 0;
      index < 50;
      index++
    ) {
      const team =
        teams.randomTeam();

      assert.equal(
        team.length,
        6,
      );

      assert.equal(
        new TeamValidator(
          'gen9ou',
        ).validateTeam(
          structuredClone(team),
        ),
        null,
      );
    }
  },
);

test(
  'Los EVs antiguos y los movimientos heredados se conservan',
  () => {
    const pokemon = teams.normalize({
      name: 'Garchomp',
      evs: '252,0,0,252,4,0',
      moves: ['earthquake'],
      ability: 'Rough Skin',
    });

    assert.deepEqual(
      pokemon.evs,
      {
        hp: 252,
        atk: 0,
        def: 0,
        spa: 252,
        spd: 4,
        spe: 0,
      },
    );

    assert.deepEqual(
      pokemon.moves,
      ['Earthquake'],
    );

    const rotom =
      teams.editor('Rotom-Wash');

    assert(
      rotom.moves.some(
        move =>
          move.id ===
          'voltswitch',
      ),
    );

    assert(
      rotom.moves.some(
        move =>
          move.id ===
          'hydropump',
      ),
    );
  },
);

test(
  'Las habilidades corresponden a la especie y forma',
  () => {
    assert.equal(
      teams.editor(
        'Great Tusk',
      ).abilities.length,
      1,
    );

    assert(
      teams.editor(
        'Corviknight',
      ).abilities.some(
        ability =>
          ability.hidden &&
          ability.id ===
            'mirrorarmor',
      ),
    );

    assert(
      teams.editor(
        'Toxtricity-Low-Key',
      ).abilities.some(
        ability =>
          ability.id === 'minus',
      ),
    );

    assert(
      !teams.editor(
        'Toxtricity',
      ).abilities.some(
        ability =>
          ability.id === 'minus',
      ),
    );
  },
);

test(
  'Se rechazan habilidades inválidas y exceso de EVs',
  () => {
    const team =
      teams.randomTeam();

    team[0].ability =
      'Salt Cure';

    assert(
      teams.validate(
        team,
      ).errors.length,
    );

    const other =
      teams.randomTeam();

    other[0].evs =
      Object.fromEntries(
        [
          'hp',
          'atk',
          'def',
          'spa',
          'spd',
          'spe',
        ].map(
          key => [key, 252],
        ),
      );

    assert(
      teams.validate(
        other,
      ).errors.length,
    );
  },
);

test(
  'La poción consume turno y unidad, pero no PP',
  t => {
    const battle =
      fixture(t);

    const pokemon =
      battle.p1.active[0];

    const bag =
      inventory();

    pokemon.sethp(
      pokemon.maxhp - 50,
    );

    const hp = pokemon.hp;
    const pp =
      pokemon.moveSlots[0].pp;

    const start =
      battle.log.length;

    itemTurn(
      battle,
      bag,
      'potion',
    );

    assert.equal(
      pokemon.hp,
      hp + 20,
    );

    assert.equal(
      pokemon.moveSlots[0].pp,
      pp,
    );

    assert.equal(
      bag.potion.uses,
      2,
    );

    assert.equal(
      battle.turn,
      2,
    );

    const lines =
      battle.log.slice(start);

    assert(
      lines.findIndex(
        line =>
          line.startsWith(
            '|-heal|p1',
          ),
      ) <
      lines.findIndex(
        line =>
          line.startsWith(
            '|move|p2',
          ),
      ),
    );

    assert(
      !lines.some(
        line =>
          line.startsWith(
            '|move|p1',
          ),
      ),
    );
  },
);

test(
  'Restaurador conserva aumentos y efectos volátiles',
  t => {
    const battle =
      fixture(t);

    const pokemon =
      battle.p1.active[0];

    const bag =
      inventory();

    pokemon.setStatus('brn');

    battle.boost(
      { atk: 2 },
      pokemon,
    );

    pokemon.addVolatile(
      'confusion',
    );

    itemTurn(
      battle,
      bag,
      'fullheal',
    );

    assert.equal(
      pokemon.status,
      '',
    );

    assert.equal(
      pokemon.boosts.atk,
      2,
    );

    assert(
      pokemon.volatiles.confusion,
    );

    assert.equal(
      bag.fullheal.uses,
      0,
    );
  },
);

test(
  'Revivir restaura PS y permite cambiar al objetivo',
  t => {
    const battle =
      fixture(t);

    const pokemon =
      battle.p1.pokemon[1];

    const bag =
      inventory();

    pokemon.faint();
    battle.faintMessages();

    assert.equal(
      battle.p1.pokemonLeft,
      1,
    );

    itemTurn(
      battle,
      bag,
      'revive',
      1,
    );

    assert.equal(
      pokemon.fainted,
      false,
    );

    assert.equal(
      pokemon.faintQueued,
      false,
    );

    assert.equal(
      pokemon.hp,
      Math.floor(
        pokemon.maxhp / 2,
      ),
    );

    assert.equal(
      battle.p1.pokemonLeft,
      2,
    );

    assert(
      battle.choose(
        'p1',
        'switch 2',
      ),
    );
  },
);

test(
  'Un objeto inútil no consume unidad ni turno',
  t => {
    const battle =
      fixture(t);

    const bag =
      inventory();

    assert.throws(
      () =>
        checkItem(
          battle,
          'p1',
          bag,
          'potion',
          0,
        ),
      /todos sus PS/,
    );

    assert.equal(
      bag.potion.uses,
      3,
    );

    assert.equal(
      battle.turn,
      1,
    );

    assert.throws(
      () =>
        checkItem(
          battle,
          'p1',
          bag,
          'revive',
          0,
        ),
      /debilitado/,
    );

    assert.throws(
      () =>
        checkItem(
          battle,
          'p1',
          bag,
          'potion',
          9,
        ),
      /objetivo/,
    );
  },
);

test(
  'Cada perspectiva recibe una sola versión de los eventos',
  () => {
    const log = [
      '|split|p1',
      '|-damage|p1a: A|200/300',
      '|-damage|p1a: A|67/100',
      '|split|p2',
      '|-damage|p2a: B|50/300',
      '|-damage|p2a: B|17/100',
    ];

    assert.deepEqual(
      perspective(log, 'p1'),
      [
        log[1],
        log[5],
      ],
    );

    assert.deepEqual(
      perspective(
        log,
        'spectator',
      ),
      [
        log[2],
        log[5],
      ],
    );
  },
);

test(
  'Las acciones inválidas conservan controles utilizables',
  t => {
    const session =
      new Session({
        rules: 'strict',
      });

    t.after(
      () => session.destroy(),
    );

    session.act({
      action: 'team 123456',
      version: 0,
    });

    assert.throws(
      () =>
        session.act({
          action: 'move 1',
          version: 0,
        }),
      /turno cambió/,
    );

    assert.throws(
      () =>
        session.act({
          action:
            'use-item potion',
          version:
            session.version,
        }),
      /válida/,
    );

    assert.throws(
      () =>
        session.act({
          item: 'potion',
          target: 0,
          version:
            session.version,
        }),
      /desactivada/,
    );

    assert(
      session.snapshot().controls,
    );

    const version =
      session.version;

    session.act({
      action: 'move 1',
      version,
    });

    assert.equal(
      session.version,
      version + 1,
    );
  },
);

test(
  'Atrapamiento y teracristalización siguen las solicitudes del motor',
  t => {
    const battle =
      fixture(t);

    const pokemon =
      battle.p1.active[0];

    pokemon.trapped = true;

    battle.makeRequest('move');

    assert(
      battle.p1.activeRequest
        .active[0].trapped,
    );

    assert(
      !battle.choose(
        'p1',
        'switch 2',
      ),
    );

    pokemon.trapped = false;

    battle.makeRequest('move');

    assert(
      battle.p1.activeRequest
        .active[0].canTerastallize,
    );

    assert(
      battle.choose(
        'p1',
        'move 1 terastallize',
      ),
    );

    assert(
      battle.choose(
        'p2',
        'move 1',
      ),
    );

    assert(
      pokemon.terastallized,
    );
  },
);

test(
  'Las batallas automáticas terminan en ambos modos',
  () => {
    for (
      const rules of [
        'bag',
        'strict',
      ]
    ) {
      for (
        let index = 0;
        index < 4;
        index++
      ) {
        const session =
          new Session({
            mode: 'auto',
            rules,
            seed: [
              index + 1,
              2,
              3,
              4,
            ],
          });

        try {
          let steps = 0;

          while (
            !session.battle.ended &&
            steps++ < 1200
          ) {
            session.step();
          }

          assert(
            session.battle.ended,
            `${rules} debe terminar`,
          );
        } finally {
          session.destroy();
        }
      }
    }
  },
);

test(
  'Struggle no tiene PP ficticios y el cambio forzado funciona',
  t => {
    const session =
      new Session({
        rules: 'strict',
      });

    t.after(
      () => session.destroy(),
    );

    session.act({
      action: 'team 123456',
      version: 0,
    });

    session.battle.p1
      .active[0].moveSlots
      .forEach(move => {
        move.pp = 0;
      });

    session.battle.makeRequest(
      'move',
    );

    const request =
      session.snapshot().controls;

    assert.equal(
      request.moves[0].id,
      'struggle',
    );

    assert.equal(
      request.moves[0].pp,
      null,
    );

    const battle =
      fixture(t);

    const pokemon =
      battle.p1.active[0];

    pokemon.faint();
    battle.faintMessages();
    battle.checkFainted();

    battle.makeRequest(
      'switch',
    );

    assert(
      battle.p1.activeRequest
        .forceSwitch[0],
    );

    assert(
      battle.choose(
        'p1',
        'switch 2',
      ),
    );

    assert.equal(
      battle.p1.active[0]
        .species.name,
      'Pikachu',
    );
  },
);

test(
  'Revival Blessing permite elegir al debilitado y continuar',
  t => {
    const team = [
      teams.normalize({
        species: 'Pawmot',
        ability: 'Natural Cure',
        moves: [
          'Revival Blessing',
          'Close Combat',
        ],
        evs: {
          hp: 4,
          atk: 252,
          spe: 252,
        },
      }),
      ...teams.randomTeam()
        .slice(0, 5),
    ];

    const opponentTeam = [
      teams.normalize({
        species: 'Blissey',
        ability: 'Natural Cure',
        moves: [
          'Soft-Boiled',
        ],
        evs: {
          hp: 252,
          def: 252,
          spd: 4,
        },
      }),
      ...teams.randomTeam()
        .slice(0, 5),
    ];

    const session =
      new Session({
        rules: 'strict',
        team,
        opponentTeam,
      });

    t.after(
      () => session.destroy(),
    );

    session.act({
      action: 'team 123456',
      version: 0,
    });

    const fainted =
      session.battle.p1
        .pokemon[5];

    fainted.faint();

    session.battle
      .faintMessages();

    session.battle
      .makeRequest('move');

    session.act({
      action: 'move 1',
      version:
        session.version,
    });

    const snapshot =
      session.snapshot();

    assert.equal(
      snapshot.controls.type,
      'switch',
    );

    assert.equal(
      snapshot.controls.reviving,
      true,
    );

    session.act({
      action: 'switch 6',
      version:
        session.version,
    });

    assert.equal(
      fainted.fainted,
      false,
    );

    assert(
      fainted.hp > 0,
    );
  },
);