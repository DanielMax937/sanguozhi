"""P0-49: source-bound base-capture personnel partition and bounded projection.

Input is the observed state at 004B3180, AFTER the separate old-prisoner
release pass. This is not a complete battle/personnel engine. All unmodelled
routing and UI/AI decisions have explicit replaceable policies.
"""
from __future__ import annotations

import copy
from fractions import Fraction

import capture_selector_profile as common
from capture_transaction_profile import exact_keys, integer, boolean

PROFILE_ID = 'source-idb-30d33b44-capture-personnel-v1'
SCHEMA_VERSION = 1
# Stored IEEE754 binary32 0x3C23D70A, NOT the rational 1/100.
SCALE = Fraction(5368709, 536870912)
PERSON_KEYS = {'id', 'valid', 'status', 'forceId', 'locationId', 'skillId',
               'ability171', 'ability172', 'horseTreasure', 'formerForceId', 'officeId'}
CONTEXT_KEYS = {'targetId', 'targetForceId', 'sourceForceId', 'sourceKind',
                'sourceLocationId', 'sourcePersonIds', 'captorRepresentativeId', 'cities', 'difficulty',
                'sourcePlayer', 'targetPlayer', 'scenarioOption18', 'inRange',
                'nearbySourceTroops', 'terrain', 'modeArgument', 'extraModifier',
                'provenance'}
POLICY_KEYS = {'id', 'ruleset', 'unknownEffects', 'disposition', 'observedCodes', 'provenance'}
DISPATCH = {0: 'recruit', 1: 'hold-captive', 2: 'release', 3: 'execute',
            4: 'no-op', 5: 'escape'}


def text(value, name):
    if type(value) is not str or not value.strip():
        raise ValueError(f'{name} must be nonempty text')


def ids(value, name, low, high):
    if type(value) is not list:
        raise ValueError(f'{name} must be a list')
    for x in value:
        integer(x, name, low, high)
    if len(value) != len(set(value)):
        raise ValueError(f'{name} must be unique')


def city_troop_capacity(specialties):
    """S1 004C0C30(0x26)/0047B330; numeric specialties are six raw bytes.

    This is source-S1 only. S2 overrides the result with city+0x3C. Use the
    output as an explicitly named observation adapter for the scalar model.
    """
    if type(specialties) is not list or len(specialties) != 6:
        raise ValueError('six specialty bytes required')
    for x in specialties:
        integer(x, 'specialty byte', 0, 255)
    first = next((i for i, x in enumerate(specialties) if x != 0), -1)
    return {'specialtyIndex': first, 'troops': 150000 if first == -1 else 100000,
            'sourceProfile': 'S1', 'stockOriginalVerified': False}


def probability(ability171, ability172, nearby, skill_id, terrain, arrest,
                super_player_attacks_ai, extra=False):
    """Audited arithmetic in bounded byte/0..18-neighbor domain.

    All intermediate dyadic operands fit the x87 64-bit significand; the
    exact rational evaluation therefore preserves __ftol2 truncation even
    where substituting mathematical 0.01 is off by one. It does not infer
    the global x87 environment or emulate unsupported overflow domains.
    """
    for x in (ability171, ability172): integer(x, 'ability', 0, 255)
    integer(nearby, 'nearby count', 0, 18)
    integer(skill_id, 'skill', -1, 99)
    integer(terrain, 'terrain', 0, 31)
    for name, val in [('arrest', arrest), ('super gate', super_player_attacks_ai), ('extra', extra)]:
        boolean(val, name)
    q = int(Fraction(120 - max(ability171, ability172), 3))
    multiplier = 1 if nearby == 0 else 100 * (1 if skill_id == 0x1d else nearby)
    terrain_factor = Fraction(3, 2) if terrain in (3, 4) else Fraction(1)
    ratio = q * multiplier * terrain_factor * SCALE / (2 if super_player_attacks_ai else 1)
    ratio += 100 if arrest else 0
    pre_cap = int(ratio)  # signed truncation, no invented lower clamp
    p = min(100, pre_cap)
    if extra: p = min(100, p + 30)
    return {'effectiveAbility': max(ability171, ability172), 'quotient': q,
            'multiplier': multiplier, 'terrainFactor': [terrain_factor.numerator, terrain_factor.denominator],
            'scale': [SCALE.numerator, SCALE.denominator],
            'difficultyDivisor': 2 if super_player_attacks_ai else 1,
            'arrestBonus': 100 if arrest else 0, 'preCap': pre_cap, 'probability': p}


def validate(state, command, context, policy):
    exact_keys(state, {'revision', 'appliedIds', 'persons'}, 'state')
    integer(state['revision'], 'revision', 0, 2**31-1)
    if type(state['appliedIds']) is not list: raise ValueError('appliedIds must be list')
    for x in state['appliedIds']: text(x, 'applied ID')
    if len(set(state['appliedIds'])) != len(state['appliedIds']): raise ValueError('duplicate applied ID')
    exact_keys(command, {'id', 'expectedRevision'}, 'command')
    text(command['id'], 'command id')
    integer(command['expectedRevision'], 'expected revision', 0, 2**31-1)
    if type(state['persons']) is not list: raise ValueError('persons must be list')
    seen = set()
    for p in state['persons']:
        exact_keys(p, PERSON_KEYS, 'person')
        integer(p['id'], 'person id', 0, 1099)
        if p['id'] in seen: raise ValueError('duplicate person ID')
        seen.add(p['id'])
        boolean(p['valid'], 'valid')
        integer(p['status'], 'status', -1, 8)
        integer(p['forceId'], 'force', -1, 46)
        integer(p['locationId'], 'location', -1, 1086)
        integer(p['skillId'], 'skill', -1, 99)
        integer(p['formerForceId'], 'former force', -1, 46)
        integer(p['officeId'], 'office', -1, 80)
        for key in ('ability171', 'ability172'): integer(p[key], key, 0, 255)
        boolean(p['horseTreasure'], 'horseTreasure')
    exact_keys(context, CONTEXT_KEYS, 'context')
    c = context
    text(c['provenance'], 'context provenance')
    integer(c['targetId'], 'target base', 0, 86)
    for key in ('targetForceId', 'sourceForceId'): integer(c[key], key, -1, 46)
    if c['sourceKind'] not in ('troop', 'building'): raise ValueError('source kind')
    integer(c['sourceLocationId'], 'source location', 0, 1086)
    if c['sourceKind'] == 'building' and c['sourceLocationId'] > 86: raise ValueError('source base location')
    if c['sourceKind'] == 'troop' and c['sourceLocationId'] < 87: raise ValueError('troop location encoding must be 87..1086')
    ids(c['sourcePersonIds'], 'source person IDs', 0, 1099)
    if len(c['sourcePersonIds']) > 3: raise ValueError('troop has at most three valid member slots')
    if c['sourceKind'] == 'building' and c['sourcePersonIds']: raise ValueError('building source uses full location collection')
    by_id = {p['id']: p for p in state['persons']}
    for x in c['sourcePersonIds']:
        if x not in by_id or not by_id[x]['valid']: raise ValueError('source member must resolve to valid person')
    if c['sourceKind'] == 'troop':
        if not c['sourcePersonIds']:
            raise ValueError('bounded troop context needs valid commander in first member slot')
        for x in c['sourcePersonIds']:
            if not 0 <= by_id[x]['status'] <= 3:
                raise ValueError('bounded source troop member must be a serving officer')
            if (by_id[x]['forceId'] != c['sourceForceId'] or
                    by_id[x]['locationId'] != c['sourceLocationId']):
                raise ValueError('source members must match source force and location')
    representative = c['captorRepresentativeId']
    if representative is not None:
        integer(representative, 'captor representative', 0, 1099)
        if representative not in by_id or not by_id[representative]['valid']:
            raise ValueError('representative must satisfy both observed pointer predicates')
        if not 0 <= by_id[representative]['status'] <= 3:
            raise ValueError('bounded representative must be a serving officer')
        if by_id[representative]['forceId'] != c['sourceForceId']:
            raise ValueError('representative must match source force')
    if c['sourceKind'] == 'troop' and representative != c['sourcePersonIds'][0]:
        raise ValueError('troop representative must be the first-slot commander')
    integer(c['difficulty'], 'difficulty', 0, 2)
    integer(c['modeArgument'], 'mode argument', 0, 1)
    integer(c['nearbySourceTroops'], 'nearby count', 0, 18)
    integer(c['terrain'], 'terrain', 0, 31)
    for key in ('sourcePlayer', 'targetPlayer', 'scenarioOption18', 'inRange', 'extraModifier'): boolean(c[key], key)
    if type(c['cities']) is not list: raise ValueError('cities must be list')
    city_ids = set()
    for city in c['cities']:
        exact_keys(city, {'id', 'valid', 'forceId'}, 'city')
        integer(city['id'], 'city id', 0, 41)
        boolean(city['valid'], 'city valid')
        integer(city['forceId'], 'city force', -1, 46)
        if city['id'] in city_ids: raise ValueError('duplicate city')
        city_ids.add(city['id'])
    if c['targetId'] <= 41:
        target = next((x for x in c['cities'] if x['id'] == c['targetId']), None)
        if not target or not target['valid'] or target['forceId'] != c['targetForceId']:
            raise ValueError('target city must match observed world')
    exact_keys(policy, POLICY_KEYS, 'policy')
    text(policy['id'], 'policy id'); text(policy['provenance'], 'policy provenance')
    if policy['ruleset'] not in ('PC-PK1.1', 'PC-Vanilla-assumed'): raise ValueError('separate version required')
    if policy['unknownEffects'] not in ('record-only', 'reject'): raise ValueError('unknownEffects policy')
    if policy['disposition'] not in ('hold-captive-v1', 'observed-codes', 'reject'): raise ValueError('disposition policy')
    if type(policy['observedCodes']) is not dict: raise ValueError('observedCodes must be dict')
    for key, code in policy['observedCodes'].items():
        if type(key) is not str or key not in {str(x) for x in seen}: raise ValueError('unknown observed disposition ID')
        integer(code, 'disposition code', 0, 5)
    if policy['disposition'] != 'observed-codes' and policy['observedCodes']: raise ValueError('unexpected observed codes')


def capture_personnel(state, command, context, policy, *, rolls=None, source_rng_state=None):
    """Return atomic partial-person-field projection; caller supplies no callbacks.

    source_rng_state is ONLY the state on entry to this probability loop, not
    a clean game's initial seed. rolls are raw [0,99] outputs at positive-p
    calls only. p=100 consumes RNG; p<=0 consumes none.
    """
    validate(state, command, context, policy)
    if (rolls is None) == (source_rng_state is None): raise ValueError('select exactly one RNG input')
    if rolls is not None:
        if type(rolls) is not list: raise ValueError('rolls must be list')
        for r in rolls: integer(r, 'roll', 0, 99)
    else: integer(source_rng_state, 'RNG state', 0, 0xffffffff)
    after = copy.deepcopy(state)
    tr = {'schemaVersion': SCHEMA_VERSION, 'profileId': PROFILE_ID,
          'evidence': {'stockOriginalVerified': False, 'completeGameTransaction': False,
                       'runtimeStatus': 'compatibility-reconstruction' if policy['ruleset'] == 'PC-PK1.1' else 'compatibility-assumption'},
          'before': copy.deepcopy(state), 'command': copy.deepcopy(command), 'context': copy.deepcopy(context),
          'policy': copy.deepcopy(policy), 'accepted': False, 'reason': None, 'candidateIds': [],
          'capturedIds': [], 'escapedIds': [], 'decisions': [], 'dispositions': [], 'fallbacks': [],
          'rng': {'kind': 'injected-rolls' if rolls is not None else 'source-LCG-at-loop-entry',
                  'initialState': source_rng_state, 'finalState': source_rng_state, 'rolls': []}, 'after': after}
    reason = ('duplicate-command' if command['id'] in state['appliedIds'] else
              'stale-revision' if command['expectedRevision'] != state['revision'] else
              'revision-exhausted' if state['revision'] == 2**31-1 else
              'unmodelled-effects' if policy['unknownEffects'] == 'reject' else
              'disposition-unresolved' if policy['disposition'] == 'reject' else None)
    if reason:
        if rolls: raise ValueError('rejected transaction cannot consume supplied rolls')
        tr['reason'] = reason
        tr['traceHash'] = common._digest(tr)
        return tr
    c = context
    candidates = sorted((p for p in state['persons'] if p['valid'] and 0 <= p['status'] <= 3
                         and p['locationId'] == c['targetId'] and p['forceId'] == c['targetForceId']), key=lambda p:p['id'])
    members = ([p for p in state['persons'] if p['id'] in c['sourcePersonIds']] if c['sourceKind'] == 'troop' else
               [p for p in state['persons'] if p['valid'] and 0 <= p['status'] <= 3
                and p['locationId'] == c['sourceLocationId'] and p['forceId'] == c['sourceForceId']])
    no_capture = (not 0 <= c['targetForceId'] <= 41 or not 0 <= c['sourceForceId'] <= 41
                  or c['scenarioOption18'] or (c['sourceKind'] == 'building' and not members))
    other_cities = [x['id'] for x in c['cities'] if x['valid'] and x['forceId'] == c['targetForceId'] and x['id'] != c['targetId']]
    tr['otherTargetCityIds'] = other_cities
    arrest = c['inRange'] and any(p['skillId'] == 0x13 for p in members)
    super_gate = c['difficulty'] == 2 and c['sourcePlayer'] and not c['targetPlayer']
    # Plan every decision and validate observed-code coverage before consuming RNG.
    for p in candidates:
        row = {'id': p['id'], 'reason': None, 'captured': None, 'arithmetic': None, 'roll': None}
        if no_capture: row.update(reason='force-option-or-empty-captor-gate', captured=False)
        elif not other_cities: row.update(reason='no-other-owned-city', captured=True)
        elif p['horseTreasure']: row.update(reason='treasure-type0', captured=False)
        elif p['skillId'] == 0x20: row.update(reason='skill32', captured=False)
        else:
            row['reason'] = 'probability'
            row['arithmetic'] = probability(p['ability171'], p['ability172'], c['nearbySourceTroops'],
                                             p['skillId'], c['terrain'], arrest, super_gate, c['extraModifier'])
        tr['decisions'].append(row)
    tr['candidateIds'] = [p['id'] for p in candidates]
    if policy['disposition'] == 'observed-codes' and set(policy['observedCodes']) != {str(x) for x in tr['candidateIds']}:
        raise ValueError('observed codes must cover all candidates, including potential escapes, exactly')
    for row in tr['decisions']:
        can_capture = row['captured'] is True or (row['arithmetic'] is not None and row['arithmetic']['probability'] > 0)
        code = policy['observedCodes'].get(str(row['id']), 1)
        if can_capture and code == 1 and c['captorRepresentativeId'] is None:
            raise ValueError('hold projection requires resolved valid captor representative before RNG')
    count = sum(row['arithmetic'] is not None and row['arithmetic']['probability'] > 0 for row in tr['decisions'])
    if rolls is not None and len(rolls) != count: raise ValueError('roll count must equal positive-probability calls')
    cursor = 0
    for row in tr['decisions']:
        if row['arithmetic'] is not None:
            p = row['arithmetic']['probability']
            if p > 0:
                if rolls is None:
                    source_rng_state = (source_rng_state * 0x6c078965 + 0x3039) & 0xffffffff
                    roll = (source_rng_state >> 16) % 100
                else: roll = rolls[cursor]
                cursor += 1
                row['roll'] = roll
                tr['rng']['rolls'].append(roll)
                row['captured'] = roll < p
            else: row['captured'] = False
        (tr['capturedIds'] if row['captured'] else tr['escapedIds']).append(row['id'])
    tr['rng']['finalState'] = source_rng_state
    by_id = {p['id']: p for p in after['persons']}
    for row in tr['decisions']:
        code = (policy['observedCodes'][str(row['id'])] if policy['disposition'] == 'observed-codes' else 1) if row['captured'] else 5
        d = {'id': row['id'], 'code': code, 'route': DISPATCH[code],
             'effectStatus': 'partial-scalar-projection' if code == 1 else 'record-only', 'writes': {}}
        if code == 1:
            # Scalar writers in 004A93B0 under valid person/representative preconditions. Location,
            # legion/force reconciliation, skill/ability cache and tasks remain
            # unprojected. Do not invent a destination or transfer allegiance.
            person = by_id[row['id']]
            d['writes'] = {'status': 5, 'formerForceId': person['forceId'], 'officeId': 80}
            person.update(d['writes'])
        tr['dispositions'].append(d)
    tr['fallbacks'] = [{'id': 'partial-person-fields-v1', 'status': 'provisional-engine-rule',
                        'reason': 'state begins after old-prisoner release; location/legion/task/caches, absent home-roster people, sorted dispatcher order, non-hold disposition effects, force and callbacks are record-only'}]
    if policy['disposition'] == 'hold-captive-v1':
        tr['fallbacks'].append({'id': 'hold-captive-v1', 'status': 'provisional-engine-rule',
                                'reason': 'choose known code1 for captures so projection is runnable without claiming original AI or user choices'})
    tr['accepted'] = True
    after['revision'] += 1
    after['appliedIds'].append(command['id'])
    tr['traceHash'] = common._digest(tr)
    return tr


def replay_capture_personnel(trace):
    if type(trace) is not dict: raise ValueError('trace must be object')
    supplied = copy.deepcopy(trace)
    digest = supplied.pop('traceHash', None)
    if digest != common._digest(supplied): raise ValueError('trace hash mismatch')
    rng = trace['rng']
    if rng['kind'] == 'source-LCG-at-loop-entry':
        result = capture_personnel(trace['before'], trace['command'], trace['context'], trace['policy'], source_rng_state=rng['initialState'])
    elif rng['kind'] == 'injected-rolls':
        result = capture_personnel(trace['before'], trace['command'], trace['context'], trace['policy'], rolls=rng['rolls'])
    else: raise ValueError('unknown RNG trace')
    if result != trace: raise ValueError('trace replay mismatch')
    return result
