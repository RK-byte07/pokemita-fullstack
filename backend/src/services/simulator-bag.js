const { Dex } = require('pokemon-showdown');

function inventory() {
  return {
    potion: {
      label: 'Poción',
      heal: 20,
      uses: 3,
    },
    superpotion: {
      label: 'Superpoción',
      heal: 60,
      uses: 2,
    },
    hyperpotion: {
      label: 'Hiperpoción',
      heal: 120,
      uses: 1,
    },
    maxpotion: {
      label: 'Poción máxima',
      heal: Infinity,
      uses: 1,
    },
    fullheal: {
      label: 'Restaurador',
      status: true,
      uses: 1,
    },
    revive: {
      label: 'Revivir',
      revive: true,
      uses: 1,
    },
  };
}

function checkItem(
  battle,
  sideId,
  bag,
  id,
  slot,
) {
  const side = battle.getSide(sideId);
  const item = bag[id];
  const target = side.pokemon[slot];

  if (
    side.requestState !== 'move' ||
    side.isChoiceDone()
  ) {
    throw new Error(
      'La mochila solo se usa al elegir un turno normal.',
    );
  }

  if (!item || item.uses <= 0) {
    throw new Error(
      'No quedan unidades de ese objeto.',
    );
  }

  if (!Number.isInteger(slot) || !target) {
    throw new Error(
      'Selecciona un objetivo válido.',
    );
  }

  if (
    item.revive
      ? !target.fainted
      : target.fainted
  ) {
    throw new Error(
      item.revive
        ? 'Selecciona un Pokémon debilitado.'
        : 'Ese Pokémon está debilitado.',
    );
  }

  if (
    item.heal &&
    target.hp >= target.maxhp
  ) {
    throw new Error(
      'El objetivo ya tiene todos sus PS.',
    );
  }

  if (item.status && !target.status) {
    throw new Error(
      'El objetivo no tiene un estado persistente que curar.',
    );
  }

  return {
    item,
    target,
    id,
  };
}

function applyItem(
  battle,
  sideId,
  choice,
) {
  const { item, target } = choice;

  if (item.uses <= 0) return;

  if (item.revive) {
    // Restauración equivalente a los indicadores
    // utilizados por Revival Blessing en Showdown.
    target.side.pokemonLeft++;

    target.fainted = false;
    target.faintQueued = false;
    target.subFainted = false;

    target.hp = 1;
    target.setStatus('');

    target.sethp(
      Math.max(
        1,
        Math.floor(target.maxhp / 2),
      ),
    );

    battle.add(
      '-heal',
      target,
      target.getHealth,
      `[from] item: ${item.label}`,
    );
  } else if (item.status) {
    // Conserva aumentos de estadísticas y efectos volátiles.
    target.cureStatus();
  } else {
    target.sethp(
      Math.min(
        target.maxhp,
        target.hp + item.heal,
      ),
    );

    battle.add(
      '-heal',
      target,
      target.getHealth,
      `[from] item: ${item.label}`,
    );
  }

  item.uses--;

  battle.add(
    'message',
    `${battle.getSide(sideId).name} usó ${
      item.label
    } en ${target.name}.`,
  );
}

function bagFormat() {
  return {
    ...Dex.formats.get('gen9ou'),

    id: 'pokemitabag',
    name: 'Pokemita · OU con mochila',

    queue: {
      resolveAction(action, midTurn) {
        const sideId =
          action.pokemon?.side.id;

        const pending =
          this.battle.pokemitaPending?.[
            sideId
          ];

        if (
          action.choice === 'move' &&
          pending
        ) {
          delete this.battle
            .pokemitaPending[sideId];

          this.battle.pokemitaQueued[
            sideId
          ] = pending;

          // El objeto reemplaza toda la acción:
          // no hay movimiento adicional ni pérdida de PP.
          return Object.getPrototypeOf(this)
            .resolveAction.call(
              this,
              {
                choice: 'event',
                event: 'PokemitaItem',
                pokemon: action.pokemon,
                order: 102,
              },
              midTurn,
            );
        }

        return Object.getPrototypeOf(this)
          .resolveAction.call(
            this,
            action,
            midTurn,
          );
      },
    },

    onPokemitaItem(pokemon) {
      const sideId = pokemon.side.id;

      const choice =
        this.pokemitaQueued[sideId];

      delete this.pokemitaQueued[sideId];

      if (choice) {
        applyItem(this, sideId, choice);
      }
    },
  };
}

module.exports = {
  inventory,
  checkItem,
  applyItem,
  bagFormat,
};