"""Source-bound capture transaction projection, never a complete game emulator.

The world collector consumes every linked-list entry in caller supplied order,
classifies it and resolves map territory. The transaction applies the audited
resource/ownership/durability projection with explicit, versioned engineering
policies for unmodelled subsystems. No unknown EXE is executed.
"""
from __future__ import annotations

import copy
import json
from typing import Any

import capture_selector_profile as selector

PROFILE_ID = 'source-idb-30d33b44-capture-transaction-v1'
SCHEMA_VERSION = 1


def integer(value: Any, name: str, low: int, high: int) -> int:
    return selector._integer(value, name, low, high)


def exact_keys(value: Any, keys: set[str], name: str) -> None:
    if type(value) is not dict or set(value) != keys:
        raise ValueError(f'{name} needs exactly {sorted(keys)}')


def boolean(value: Any, name: str) -> bool:
    if type(value) is not bool:
        raise ValueError(f'{name} must be a bool')
    return value


def validate_world(world: Any) -> None:
    exact_keys(world, {'buildings', 'typeClasses', 'mapCells', 'regionCityIds',
                       'provenance'}, 'world')
    if type(world['provenance']) is not str or not world['provenance'].strip():
        raise ValueError('world provenance is required')
    if type(world['typeClasses']) is not list or len(world['typeClasses']) != 64:
        raise ValueError('exactly 64 facility classes required')
    for value in world['typeClasses']:
        integer(value, 'facility class', -1, 2**31 - 1)
    if type(world['regionCityIds']) is not list or len(world['regionCityIds']) != 128:
        raise ValueError('exactly 128 territory-to-city entries required')
    for value in world['regionCityIds']:
        integer(value, 'territory city byte', 0, 255)
    if type(world['mapCells']) is not dict or type(world['buildings']) is not list:
        raise ValueError('mapCells must be an object and buildings an ordered list')
    for key, value in world['mapCells'].items():
        if type(key) is not str:
            raise ValueError('map cell key must be x,y')
        try:
            x, y = key.split(',')
            if key != f'{int(x)},{int(y)}':
                raise ValueError()
            integer(int(x), 'map x', 0, 199)
            integer(int(y), 'map y', 0, 199)
        except (ValueError, TypeError):
            raise ValueError('map cell key must be canonical x,y in 0..199') from None
        integer(value, 'map cell word', 0, 0xffffffff)
    ids = set()
    for row in world['buildings']:
        exact_keys(row, {'id', 'valid', 'typeId', 'state', 'forceId', 'x', 'y'}, 'building')
        integer(row['id'], 'building id', 0, 0x3fff)
        if row['id'] in ids:
            raise ValueError('duplicate building id')
        ids.add(row['id'])
        boolean(row['valid'], 'building valid')
        integer(row['typeId'], 'facility type', -2**31, 2**31 - 1)
        integer(row['state'], 'construction state', 0, 2**31 - 1)
        integer(row['forceId'], 'force ID', -1, 46)
        integer(row['x'], 'building x', 0, 199)
        integer(row['y'], 'building y', 0, 199)
        if row['valid'] and f"{row['x']},{row['y']}" not in world['mapCells']:
            raise ValueError('valid building requires mapped coordinates')


def collect_capture_facilities(world: dict, target_id: int) -> dict:
    """Collect the full ordered city branch, with no domestic owner filter.

    The list and static table/map observations are input data, not recovered
    stock geography. Requiring unique stable IDs is an engineering constraint.
    This does not sort IDs, infer order, or execute individual-destruction loot.
    """
    validate_world(world)
    integer(target_id, 'target id', 0, 86)
    targets = [row for row in world['buildings'] if row['id'] == target_id and row['valid']]
    if len(targets) != 1:
        raise ValueError('target must be a valid world building')
    old_force = targets[0]['forceId']
    result = {'cityBranch': target_id <= 41, 'candidateIds': [],
              'immediateDestroyedIds': [], 'protectedSpecialIds': [],
              'overflowIds': [], 'treasure42ResetRequests': [], 'visits': []}
    if target_id > 41:
        return result
    for row in world['buildings']:
        event = {'id': row['id'], 'decision': 'invalid'}
        if not row['valid']:
            result['visits'].append(event)
            continue
        type_id = row['typeId']
        category = world['typeClasses'][type_id] if 0 <= type_id <= 63 else -1
        word = world['mapCells'][f"{row['x']},{row['y']}"]
        city_id = world['regionCityIds'][(word >> 5) & 127]
        event.update({'category': category, 'cityId': city_id, 'decision': 'unaffected'})
        # 00487B30: categories 1/2 and category3 except type24. Domestic
        # category4 and base category0 are explicitly excluded by the caller.
        cleanup = category in (1, 2) or (category == 3 and type_id != 24)
        if cleanup and 0 <= old_force <= 46 and row['forceId'] == old_force and city_id == target_id:
            event['decision'] = 'destroy-old-force-military'
            result['immediateDestroyedIds'].append(row['id'])
        elif category == 4 and city_id == target_id:
            if row['state'] == 0:
                event['decision'] = 'destroy-incomplete-domestic'
                result['immediateDestroyedIds'].append(row['id'])
                if type_id == 30:
                    result['treasure42ResetRequests'].append(row['id'])
            elif type_id == 30:
                event['decision'] = 'protected-completed-type30'
                result['protectedSpecialIds'].append(row['id'])
            elif len(result['candidateIds']) < 30:
                event['decision'] = 'selector-candidate'
                result['candidateIds'].append(row['id'])
            else:
                event['decision'] = 'array-capacity-overflow-untouched'
                result['overflowIds'].append(row['id'])
        result['visits'].append(event)
    return result

RESOURCE_KEYS = {'gold', 'food', 'troops', 'weapons'}
BASE_KEYS = {'id', 'forceId', 'legionId', 'resources', 'morale', 'durability',
             'intrinsicMaxDurability', 'tech26', 'fire', 'publicOrder', 'cityFlags',
             'cityQueueId', 'governorId'}
SOURCE_KEYS = {'id', 'valid', 'kind', 'forceId', 'legionId', 'forceValid',
               'legionValid', 'commanderCharm', 'legionLeaderCharm', 'tech26',
               'x', 'y', 'gold', 'food', 'troops', 'morale', 'cargo', 'removed',
               'entryProfile', 'legionForceId'}
POLICY_KEYS = {'id', 'ruleset', 'unknownEffects', 'troopEntry', 'normalCaps',
               'neutralCaps', 'oldCaps', 'capacityProvenance'}
COMMAND_KEYS = {'id', 'expectedRevision', 'caller', 'relationship',
                'upstreamEligible', 'entryRangePass', 'gateProvenance'}


def resources(value: Any, name: str) -> None:
    exact_keys(value, RESOURCE_KEYS, name)
    # Deliberately restricted representable fixture range avoids signed product
    # overflow in the original multiply-by-percent sequence (max charm 255).
    for key in ('gold', 'food', 'troops'):
        integer(value[key], name + '.' + key, 0, 1_000_000)
    if type(value['weapons']) is not list or len(value['weapons']) != 12:
        raise ValueError(name + '.weapons must contain exactly 12 counters')
    for item in value['weapons']:
        integer(item, 'weapon count', 0, 1_000_000)


def validate(state: dict, command: dict, policy: dict) -> None:
    exact_keys(state, {'revision', 'appliedIds', 'world', 'base', 'source'}, 'state')
    integer(state['revision'], 'revision', 0, 2**31 - 1)
    if (type(state['appliedIds']) is not list or
            any(type(x) is not str or not x for x in state['appliedIds']) or
            len(set(state['appliedIds'])) != len(state['appliedIds'])):
        raise ValueError('appliedIds must be unique nonempty strings')
    validate_world(state['world'])
    base = state['base']
    exact_keys(base, BASE_KEYS, 'base')
    integer(base['id'], 'base id', 0, 86)
    integer(base['forceId'], 'base force', -1, 46)
    integer(base['legionId'], 'base legion', -1, 46)
    resources(base['resources'], 'base resources')
    integer(base['morale'], 'base morale', 0, 255)
    integer(base['durability'], 'base durability', 0, 32767)
    integer(base['intrinsicMaxDurability'], 'intrinsic max durability', 0, 29767)
    boolean(base['tech26'], 'base tech26')
    integer(base['fire'], 'base fire byte', 0, 255)
    integer(base['publicOrder'], 'public order', 0, 100)
    integer(base['cityFlags'], 'city flags', 0, 0xffffffff)
    integer(base['cityQueueId'], 'city queue field', -1, 2**31 - 1)
    integer(base['governorId'], 'governor ID', -1, 2**31 - 1)
    maximum = base['intrinsicMaxDurability'] + (3000 if base['tech26'] else 0)
    if base['durability'] > maximum:
        raise ValueError('initial durability exceeds current source max')
    target = [x for x in state['world']['buildings'] if x['id'] == base['id'] and x['valid']]
    if len(target) != 1 or target[0]['forceId'] != base['forceId']:
        raise ValueError('base/world target and ownership mismatch')
    expected_type = 0 if base['id'] <= 41 else (1 if base['id'] <= 51 else 2)
    if target[0]['typeId'] != expected_type:
        raise ValueError('00486680 requires matching base ID and facility type')
    src = state['source']
    exact_keys(src, SOURCE_KEYS, 'source')
    if type(src['id']) is not str or not src['id']:
        raise ValueError('source ID required')
    if src['kind'] not in ('troop', 'other'):
        raise ValueError('source kind must be troop or other')
    for key in ('valid', 'forceValid', 'legionValid', 'tech26', 'removed'):
        boolean(src[key], 'source ' + key)
    integer(src['forceId'], 'source force', -1, 46)
    integer(src['legionId'], 'source legion', -1, 46)
    integer(src['legionForceId'], 'source legion force', -1, 46)
    if src['entryProfile'] not in ('ordinary-no-owner-change', 'unresolved'):
        raise ValueError('source entry profile must identify ordinary coherent entry or unresolved')
    if src['legionValid'] and src['forceValid'] and src['legionForceId'] != src['forceId']:
        raise ValueError('incoherent source force/legion force')
    if src['legionValid'] and src['legionId'] < 0:
        raise ValueError('valid source legion requires nonnegative ID')
    for key in ('commanderCharm', 'legionLeaderCharm'):
        if src[key] is not None:
            integer(src[key], key, 0, 255)
    for key in ('x', 'y'):
        integer(src[key], key, 0, 199)
    for key in ('gold', 'food', 'troops'):
        integer(src[key], 'source ' + key, 0, 1_000_000)
    integer(src['morale'], 'source morale', 0, 255)
    if type(src['cargo']) is not list or len(src['cargo']) != 12:
        raise ValueError('source cargo must contain the 12 ordered getter slots')
    for slot in src['cargo']:
        exact_keys(slot, {'weaponId', 'amount'}, 'cargo slot')
        integer(slot['weaponId'], 'cargo weapon ID', -1, 255)
        integer(slot['amount'], 'cargo amount', 0, 1_000_000)
    if src['kind'] != 'troop' and src['commanderCharm'] is not None:
        raise ValueError('non-troop source has no resolved commander slot')
    exact_keys(policy, POLICY_KEYS, 'policy')
    if type(policy['id']) is not str or not policy['id']:
        raise ValueError('named policy required')
    if policy['ruleset'] not in ('PC-PK1.1', 'PC-Vanilla-assumption'):
        raise ValueError('unsupported ruleset; no console or implicit Vanilla reuse')
    if policy['unknownEffects'] not in ('record-only', 'reject'):
        raise ValueError('unknownEffects must be explicitly record-only or reject')
    if policy['troopEntry'] not in ('source-scalar-projection', 'skip', 'reject'):
        raise ValueError('explicit troopEntry policy required')
    if type(policy['capacityProvenance']) is not str or not policy['capacityProvenance'].strip():
        raise ValueError('dynamic capacities require provenance')
    for name in ('normalCaps', 'neutralCaps', 'oldCaps'):
        exact_keys(policy[name], RESOURCE_KEYS | {'morale'}, name)
        resources({key: policy[name][key] for key in RESOURCE_KEYS}, name)
        integer(policy[name]['morale'], 'morale cap', 0, 255)
    exact_keys(command, COMMAND_KEYS, 'command')
    # Old capacities describe the command's input revision, not a later state
    # reached by this very transaction. Shape checks still apply on retries.
    if command.get('expectedRevision') == state['revision'] and command.get('id') not in state['appliedIds']:
        if any(base['resources'][key] > policy['oldCaps'][key] for key in ('gold', 'food', 'troops')) or any(n > c for n, c in zip(base['resources']['weapons'], policy['oldCaps']['weapons'])) or base['morale'] > policy['oldCaps']['morale']:
            raise ValueError('pre-capture state exceeds explicitly observed old capacities')
    if any(world_class != 0 for world_class in state['world']['typeClasses'][:3]):
        raise ValueError('projection requires class0 for the three base types')
    exact_keys(command, COMMAND_KEYS, 'command')
    if type(command['id']) is not str or not command['id']:
        raise ValueError('transaction ID required')
    integer(command['expectedRevision'], 'expected revision', 0, 2**31 - 1)
    if command['caller'] not in ('fire', 'trap', 'attack'):
        raise ValueError('only three decoded direct caller families supported')
    for key in ('upstreamEligible', 'entryRangePass'):
        boolean(command[key], key)
    relationship_blocked(command['relationship'])
    if command['expectedRevision'] == state['revision'] and command['id'] not in state['appliedIds'] and command['relationship']['targetForceId'] != base['forceId']:
        raise ValueError('relationship target differs from base owner')
    if command['caller'] != 'trap' and command['relationship']['sourceForceId'] != src['forceId']:
        raise ValueError('fire/attack relationship source differs from capture source')
    if type(command['gateProvenance']) is not str or not command['gateProvenance'].strip():
        raise ValueError('observed upstream/relationship/range gate provenance required')
    # Bound exact integer products in the troop morale merge to signed32.
    if base['resources']['troops'] * base['morale'] + src['troops'] * src['morale'] > 2**31 - 1:
        raise ValueError('troop morale product exceeds supported signed32 projection')


def relationship_blocked(relation: dict) -> bool:
    """004B6260->004B5D70 directed same/alliance/truce exclusion."""
    exact_keys(relation, {'sourceForceId', 'targetForceId', 'sourceValid',
                          'targetValid', 'allied', 'truce'}, 'relationship')
    for key in ('sourceForceId', 'targetForceId'):
        integer(relation[key], key, -1, 46)
    for key in ('sourceValid', 'targetValid', 'allied'):
        boolean(relation[key], key)
    integer(relation['truce'], 'truce byte', 0, 255)
    if not relation['sourceValid'] or not relation['targetValid']:
        return False
    return (relation['sourceForceId'] == relation['targetForceId'] or
            relation['allied'] or relation['truce'] > 0)


def adjacent(source: dict, target: dict) -> bool:
    # Fixed 00483DB0 parity table, byte-audited in P0-48 evidence.
    offsets = HEX_NEIGHBORS[source['x'] & 1]
    return any((source['x'] + dx, source['y'] + dy) == (target['x'], target['y'])
               for dx, dy in offsets)


# Initialized below against the independently extracted source table.
HEX_NEIGHBORS = (
    ((-1, -1), (0, -1), (1, -1), (-1, 0), (0, 1), (1, 0)),
    ((-1, 0), (0, -1), (1, 0), (-1, 1), (0, 1), (1, 1)),
)


def _cap_resources(base: dict, caps: dict) -> None:
    for key in ('gold', 'food', 'troops'):
        base['resources'][key] = min(base['resources'][key], caps[key])
    base['resources']['weapons'] = [min(n, c) for n, c in
                                  zip(base['resources']['weapons'], caps['weapons'])]


def _run(state: dict, command: dict, policy: dict, *, selector_trace: dict | None = None,
         raw_draws=None, seed=None, source_rng_state=None) -> dict:
    validate(state, command, policy)
    before = copy.deepcopy(state)
    after = copy.deepcopy(state)
    base, src = after['base'], after['source']
    target = next(x for x in after['world']['buildings'] if x['id'] == base['id'])
    mode = 1 if command['caller'] in ('fire', 'trap') else int(not adjacent(src, target))
    trace = {'schemaVersion': SCHEMA_VERSION, 'profileId': PROFILE_ID,
             'selectorSourceFingerprint': selector.SOURCE_FINGERPRINT,
             'evidence': {'stockOriginalVerified': False,
                          'runtimeStatus': ('compatibility-reconstruction' if policy['ruleset'] == 'PC-PK1.1'
                                            else 'compatibility-assumption'),
                          'completeGameTransaction': False},
             'command': copy.deepcopy(command), 'policy': copy.deepcopy(policy),
             'before': before, 'modeArgument': mode, 'events': [], 'fallbacks': [],
             'collection': None, 'selector': None, 'accepted': False, 'reason': None, 'fallbackCount': 0}
    events = trace['events']
    reason = None
    if command['id'] in state['appliedIds']:
        reason = 'duplicate-transaction'
    elif command['expectedRevision'] != state['revision']:
        reason = 'stale-revision'
    elif state['revision'] == 2**31 - 1:
        reason = 'revision-exhausted'
    elif not src['valid'] or src['removed'] or not command['upstreamEligible']:
        reason = 'invalid-source-or-upstream-gate'
    elif command['caller'] == 'attack' and src['kind'] != 'troop':
        reason = 'attack-caller-requires-troop'
    elif relationship_blocked(command['relationship']):
        reason = 'relationship-gate-blocked'
    elif base['durability'] != 0 and (command['caller'] != 'attack' or base['resources']['troops'] != 0):
        reason = 'cause-not-satisfied'
    elif policy['unknownEffects'] == 'reject':
        reason = 'unmodelled-personnel-force-event-effects'
    elif src['kind'] == 'troop' and 0 <= src['forceId'] <= 41 and command['entryRangePass'] and policy['troopEntry'] == 'reject':
        reason = 'unmodelled-entry-effects'
    if reason is not None:
        if selector_trace is not None:
            raise ValueError('rejected transaction cannot have a selector trace')
        trace['reason'] = reason
        trace['after'] = after
        trace['traceHash'] = selector._digest(trace)
        return trace
    normal = src['forceValid'] and 0 <= src['forceId'] <= 41 and src['legionValid']
    entry = src['kind'] == 'troop' and 0 <= src['forceId'] <= 41 and command['entryRangePass']
    if entry and policy['troopEntry'] == 'source-scalar-projection':
        if not normal or src['entryProfile'] != 'ordinary-no-owner-change' or src['commanderCharm'] is None:
            raise ValueError('source-scalar entry requires a resolved ordinary commander/ownership context')
    trace['accepted'] = True
    trace['fallbacks'].append({'id': 'unmodelled-subsystems-record-only-v1',
                               'status': 'provisional-engine-rule',
                               'reason': 'bounded projection excludes personnel/captive outcomes, force amount/stat adjustments and extinction, city facility counters and references, governor ranking/reconciliation, events/UI/AI orders',
                               'phase': 'pre-resource-through-post-finalizer'})
    charm = src['commanderCharm'] if src['kind'] == 'troop' else None
    percent = max(5, (charm // 10) if charm is not None else 5)
    previous = copy.deepcopy(base['resources'])
    for key in ('gold', 'food', 'troops'):
        base['resources'][key] = previous[key] * percent // 100
    base['resources']['weapons'] = [n * percent // 100 for n in previous['weapons']]
    if base['resources']['troops'] == 0:
        base['morale'] = 0
    events.append({'phase': 'resource-retention', 'address': '004B329B',
                   'percent': percent, 'before': previous, 'after': copy.deepcopy(base['resources'])})
    collection = collect_capture_facilities(after['world'], base['id'])
    trace['collection'] = collection
    # Advance-before-delete iteration is represented by the visit order.
    for visit in collection['visits']:
        if visit['id'] not in collection['immediateDestroyedIds']:
            continue
        if visit['id'] in collection['treasure42ResetRequests']:
            events.append({'phase': 'treasure42-reset-request', 'beforeBuildingId': visit['id'],
                           'holder': -1, 'city': -1, 'state': 0})
        next(row for row in after['world']['buildings'] if row['id'] == visit['id'])['valid'] = False
        events.append({'phase': 'immediate-facility-destruction', 'id': visit['id'],
                       'reason': visit['decision'], 'perFacilityLoot': 0})
    after['world']['buildings'] = [row for row in after['world']['buildings']
                                   if row['id'] not in collection['immediateDestroyedIds']]
    if collection['cityBranch']:
        options = {'provenance': {'qualification': 'full world collector at ' + PROFILE_ID,
                                 'ordering': 'supplied linked-list order; ' + after['world']['provenance'],
                                 'source': selector.SOURCE_FINGERPRINT},
                   'commander_charm': charm, 'capturing_force_id': src['forceId'],
                   'missing_charm_policy': 'source-default-20',
                   'profile_id': selector.PROFILE_ID, 'source_fingerprint': selector.SOURCE_FINGERPRINT}
        if selector_trace is not None:
            picked = selector.replay_capture_facilities(selector_trace, collection['candidateIds'], **options)
        else:
            picked = selector.select_capture_facilities(collection['candidateIds'], **options,
                     raw_draws=raw_draws, seed=seed, source_rng_state=source_rng_state)
        trace['selector'] = picked
        selected_destroyed = picked['outcome']['destroyedIds']
    else:
        if selector_trace is not None:
            raise ValueError('port/gate cannot consume city selector trace')
        if raw_draws not in (None, [], ()):
            raise ValueError('port/gate path must consume no selector draws')
        selected_destroyed = []
    after['world']['buildings'] = [row for row in after['world']['buildings']
                                   if row['id'] not in selected_destroyed]
    events.append({'phase': 'selector-destruction', 'immediateIds': collection['immediateDestroyedIds'],
                   'selectorIds': selected_destroyed, 'perFacilityLoot': 0,
                   'treasure42ResetRequests': collection['treasure42ResetRequests']})
    if collection['treasure42ResetRequests']:
        trace['fallbacks'].append({'id': 'treasure42-reset-event-only-v1', 'status': 'provisional-engine-rule',
                                   'reason': 'request owner=-1, location=-1, state=0; treasure state is outside projection'})
    normal = src['forceValid'] and 0 <= src['forceId'] <= 41 and src['legionValid']
    old_force = base['forceId']
    caps = policy['normalCaps'] if normal else policy['neutralCaps']
    base['forceId'] = src['forceId'] if normal else -1
    base['legionId'] = src['legionId'] if normal else -1
    base['tech26'] = src['tech26'] if normal else False
    maximum = base['intrinsicMaxDurability'] + (3000 if base['tech26'] else 0)
    base['durability'] = min(base['durability'], maximum)
    target['forceId'] = base['forceId']
    refreshed = []
    for row in after['world']['buildings']:
        type_id = row['typeId']
        if not row['valid'] or not 0 <= type_id <= 63 or after['world']['typeClasses'][type_id] != 4:
            continue
        word = after['world']['mapCells'][f"{row['x']},{row['y']}"]
        if base['id'] <= 41 and after['world']['regionCityIds'][(word >> 5) & 127] == base['id']:
            row['forceId'] = base['forceId']
            refreshed.append(row['id'])
    if base['id'] <= 41 and base['forceId'] != old_force:
        base['cityFlags'] &= ~0x13
    if not normal:
        base['resources'] = {'gold': 0, 'food': 0, 'troops': 0, 'weapons': [0] * 12}
        base['morale'] = 0
        base['fire'] = 0
        base['governorId'] = -1
        if base['id'] <= 41:
            base['cityFlags'] &= ~0x13
            base['cityQueueId'] = -1
    elif base['forceId'] != old_force:
        base['morale'] = min(base['morale'], caps['morale'])
        if base['id'] <= 41:
            leader_charm = src['legionLeaderCharm'] or 0
            base['publicOrder'] = min(100, max(base['publicOrder'], 70 + leader_charm // 5))
        _cap_resources(base, caps)
    events.append({'phase': 'ownership-finalizer', 'address': '004B40C0' if normal else '004B49B0',
                   'normalTransfer': normal, 'oldForceId': old_force, 'newForceId': base['forceId'],
                   'maximumAfterOwnership': maximum, 'snapshot': copy.deepcopy(base),
                   'derivedDomesticOwnerRefreshIds': refreshed})
    # The top-level entry path is gated on source troop, normal numeric force,
    # and externally observed 0049D640 range result. Actual entry also requires
    # target/source force agreement; invalid pointer contexts cannot be inferred.
    entry = src['kind'] == 'troop' and 0 <= src['forceId'] <= 41 and command['entryRangePass']
    if entry and policy['troopEntry'] == 'source-scalar-projection':
        bt, incoming = base['resources']['troops'], src['troops']
        denominator = bt + incoming
        numerator = bt * base['morale'] + incoming * src['morale']
        base['morale'] = min(caps['morale'], numerator // denominator if denominator else 0)
        additions = []
        for key in ('gold', 'food', 'troops'):
            old = base['resources'][key]
            new = min(caps[key], old + src[key])
            base['resources'][key] = new
            additions.append({'resource': key, 'requested': src[key], 'added': new - old,
                              'discarded': src[key] - (new - old)})
        if base['resources']['troops'] == 0:
            base['morale'] = 0
        for index, slot in enumerate(src['cargo']):
            weapon, amount = slot['weaponId'], slot['amount']
            if 0 <= weapon <= 11:
                old = base['resources']['weapons'][weapon]
                new = min(caps['weapons'][weapon], old + amount)
                base['resources']['weapons'][weapon] = new
                additions.append({'slot': index, 'weaponId': weapon, 'requested': amount,
                                  'added': new - old, 'discarded': amount - (new - old)})
            else:
                additions.append({'slot': index, 'weaponId': weapon, 'ignored': amount})
        src['removed'] = True
        events.append({'phase': 'troop-entry', 'address': '004BF489..004BF579',
                       'moraleNumerator': numerator, 'moraleDenominator': denominator,
                       'additions': additions, 'removal': 'projected-immediate'})
        trace['fallbacks'].append({'id': 'entry-membership-immediate-projection-v1',
                                   'status': 'provisional-engine-rule',
                                   'reason': 'officer reassignment, ruler/corps choice and display-queue timing outside projection'})
    elif entry:
        trace['fallbacks'].append({'id': 'troop-entry-explicitly-skipped-v1',
                                   'status': 'provisional-engine-rule',
                                   'reason': 'chosen policy leaves source resources and membership unchanged'})
        events.append({'phase': 'troop-entry', 'skippedByPolicy': True})
    elif src['kind'] == 'troop' and not 0 <= src['forceId'] <= 41:
        trace['fallbacks'].append({'id': 'special-force-entry-record-only-v1', 'status': 'provisional-engine-rule',
                                   'reason': '004B1AC0 special-force path is outside normal entry projection'})
    events.append({'phase': 'governor-finalizer', 'address': '004BCA30',
                   'projectedGovernorUnchanged': True})
    old_durability = base['durability']
    base['durability'] = max(base['durability'], maximum // 2)
    events.append({'phase': 'durability-floor', 'address': '004B3643..004B366C',
                   'maximumAtTail': maximum, 'before': old_durability, 'after': base['durability']})
    after['revision'] += 1
    after['appliedIds'].append(command['id'])
    trace['after'] = after
    trace['fallbackCount'] = len(trace['fallbacks'])
    trace['traceHash'] = selector._digest(trace)
    return trace


def capture_transaction(state: dict, command: dict, policy: dict, *,
                        raw_draws=None, seed=None, source_rng_state=None) -> dict:
    """Atomically return a new projected state and full evidence/replay trace.

    No input is mutated; explicit named policy and source-bound target data are
    required. One selector RNG mode is mandatory for city acceptance. Ports and
    gates bypass that selector and never advance its RNG. Rejected commands do
    not advance revision or consume RNG. source_rng_state is state at selector
    entry, not necessarily capture entry (personnel can consume global RNG).
    """
    return _run(state, command, policy, raw_draws=raw_draws, seed=seed,
                source_rng_state=source_rng_state)


def replay_capture_transaction(trace: dict, state: dict, command: dict, policy: dict) -> dict:
    """Replay recorded selector draws; independently bind state, command, policy.

    Exact canonical comparison catches reordered candidates, changed profiles,
    gates, capacities, outcomes, and extra fields. Hashes are not signatures.
    This never invokes RNG, even when trace metadata contains a seed/state.
    """
    if type(trace) is not dict:
        raise ValueError('trace must be an object')
    expected = _run(state, command, policy, selector_trace=trace.get('selector'))
    if selector._canonical(expected) != selector._canonical(trace):
        raise ValueError('transaction trace/state/command/policy mismatch')
    return expected


def save_trace(trace: dict) -> str:
    return json.dumps(trace, ensure_ascii=False, sort_keys=True, allow_nan=False)
