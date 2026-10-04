"""P0-48 source-scoped capture transaction regression and static evidence checks."""
from __future__ import annotations

import copy
import hashlib
import json
import re
import struct
import unittest
from pathlib import Path
from unittest.mock import patch

import capture_transaction_profile as m
import capture_selector_profile as s

ROOT = Path(__file__).resolve().parents[1]


def fixture(base_id=0, caller='attack'):
    world = {'buildings': [], 'typeClasses': [0] * 64,
             'mapCells': {}, 'regionCityIds': [255] * 128,
             'provenance': 'self-authored fixture, explicit list order, not a game save'}
    world['regionCityIds'][1] = base_id if base_id <= 41 else 0
    world['typeClasses'][3:7] = [1, 2, 3, 4]
    world['typeClasses'][24] = 3
    world['typeClasses'][30] = 4

    def building(identifier, type_id, force=1, state=1, region=1, valid=True):
        row = {'id': identifier, 'typeId': type_id, 'forceId': force,
               'state': state, 'x': len(world['buildings']), 'y': 20, 'valid': valid}
        world['buildings'].append(row)
        world['mapCells'][f"{row['x']},{row['y']}"] = region << 5
        return row
    target_type = 0 if base_id <= 41 else (1 if base_id <= 51 else 2)
    building(base_id, target_type)
    building(102, 6, force=3)
    building(100, 6)
    building(101, 6)
    res = {'gold': 10001, 'food': 20009, 'troops': 999, 'weapons': [999] * 12}
    base = {'id': base_id, 'forceId': 1, 'legionId': 1, 'resources': res,
            'morale': 70, 'durability': 0, 'intrinsicMaxDurability': 5000,
            'tech26': False, 'fire': 3, 'publicOrder': 20, 'cityFlags': 0xFF,
            'cityQueueId': 9, 'governorId': 7}
    source = {'id': 'troop-8', 'valid': True, 'kind': 'troop', 'forceId': 2,
              'legionId': 2, 'forceValid': True, 'legionValid': True,
              'commanderCharm': 60, 'legionLeaderCharm': 90, 'tech26': False,
              'x': 0, 'y': 19, 'gold': 10, 'food': 20, 'troops': 100,
              'morale': 90, 'cargo': [{'weaponId': -1, 'amount': 0} for _ in range(12)],
              'removed': False, 'entryProfile': 'ordinary-no-owner-change', 'legionForceId': 2}
    state = {'revision': 0, 'appliedIds': [], 'world': world, 'base': base, 'source': source}
    caps = {'gold': 100000, 'food': 1000000, 'troops': 100000,
            'weapons': [100000] * 5 + [100] * 7, 'morale': 100}
    # Input advanced-weapon count must obey observed old-cap contract.
    base['resources']['weapons'] = [999] * 5 + [99] * 7
    policy = {'id': 'synthetic-capture-projection-v1', 'ruleset': 'PC-PK1.1',
              'unknownEffects': 'record-only', 'troopEntry': 'source-scalar-projection',
              'normalCaps': copy.deepcopy(caps), 'neutralCaps': copy.deepcopy(caps),
              'oldCaps': copy.deepcopy(caps),
              'capacityProvenance': 'fixture dynamic cap observations, not default universal game constants'}
    command = {'id': 'capture-1', 'expectedRevision': 0, 'caller': caller,
               'relationship': {'sourceForceId': 2, 'targetForceId': 1, 'sourceValid': True,
                                'targetValid': True, 'allied': False, 'truce': 0}, 'upstreamEligible': True,
               'entryRangePass': False, 'gateProvenance': 'fixture caller gate observations'}
    return state, command, policy, building


def run(state, command, policy, **rng):
    if not rng:
        rng = {'seed': 'capture-regression'}
    return m.capture_transaction(state, command, policy, **rng)


class CaptureTransactions(unittest.TestCase):
    def test_collects_world_in_linked_order_without_domestic_owner_filter(self):
        state, _, _, add = fixture()
        got = m.collect_capture_facilities(state['world'], 0)
        self.assertEqual(got['candidateIds'], [102, 100, 101])
        self.assertEqual(got['visits'][1]['cityId'], 0)
        self.assertEqual(state['world']['buildings'][1]['forceId'], 3)

    def test_cleanup_categories_owner_territory_and_type24(self):
        state, _, _, add = fixture()
        add(200, 3, state=0)
        add(201, 4)
        add(202, 5)
        add(203, 24)
        add(204, 3, force=2)
        add(205, 3, region=2)
        add(206, 3, valid=False)
        self.assertEqual(m.collect_capture_facilities(state['world'], 0)['immediateDestroyedIds'], [200, 201, 202])
        state['base']['forceId'] = -1
        state['world']['buildings'][0]['forceId'] = -1
        add(207, 3, force=-1)
        self.assertEqual(m.collect_capture_facilities(state['world'], 0)['immediateDestroyedIds'], [])

    def test_domestic_incomplete_type30_and_overflow(self):
        state, _, _, add = fixture()
        add(200, 6, state=0)
        add(201, 30, state=0)
        add(202, 30, state=2)
        add(203, 6, region=2)
        for i in range(204, 237):
            add(i, 6)
        got = m.collect_capture_facilities(state['world'], 0)
        self.assertEqual(got['immediateDestroyedIds'], [200, 201])
        self.assertEqual(got['treasure42ResetRequests'], [201])
        self.assertEqual(got['protectedSpecialIds'], [202])
        self.assertEqual(len(got['candidateIds']), 30)
        self.assertEqual(got['overflowIds'], list(range(231, 237)))

    def test_map_word_masks_territory_not_owner_or_stored_city(self):
        state, _, _, _ = fixture()
        state['world']['regionCityIds'][7] = 0
        row = state['world']['buildings'][1]
        state['world']['mapCells'][f"{row['x']},{row['y']}"] = (7 << 5) | 0xf000001f
        self.assertEqual(m.collect_capture_facilities(state['world'], 0)['candidateIds'][0], 102)

    def test_city_id_boundaries_and_no_port_gate_rng(self):
        for target in (0, 41, 42, 51, 52, 86):
            state, cmd, pol, _ = fixture(target)
            with patch.object(s, 'engineering_draws', side_effect=AssertionError('unexpected RNG')):
                if target > 41:
                    got = run(state, cmd, pol)
                    self.assertIsNone(got['selector'])
                    self.assertFalse(got['collection']['cityBranch'])
            if target <= 41:
                self.assertTrue(run(state, cmd, pol)['collection']['cityBranch'])

    def test_fire_trap_require_durability_zero_attack_accepts_either(self):
        for caller in ('fire', 'trap', 'attack'):
            for durability, troops in ((0, 999), (3000, 0), (3000, 999), (0, 0)):
                state, cmd, pol, _ = fixture(caller=caller)
                state['base']['durability'] = durability
                state['base']['resources']['troops'] = troops
                got = run(state, cmd, pol)
                self.assertEqual(got['accepted'], durability == 0 or (caller == 'attack' and troops == 0))

    def test_mode_is_adjacency_not_damage_cause(self):
        for caller in ('fire', 'trap', 'attack'):
            state, cmd, pol, _ = fixture(caller=caller)
            self.assertEqual(run(state, cmd, pol)['modeArgument'], int(caller != 'attack'))
            state['source']['y'] = 10
            self.assertEqual(run(state, cmd, pol)['modeArgument'], 1)
        state, cmd, pol, _ = fixture()
        state['base']['durability'] = 4000
        state['base']['resources']['troops'] = 0
        self.assertEqual(run(state, cmd, pol)['modeArgument'], 0)

    def test_adjacency_all_parities_and_same_tile(self):
        for x in (20, 21):
            src = {'x': x, 'y': 50}
            self.assertFalse(m.adjacent(src, src))
            for dx, dy in m.HEX_NEIGHBORS[x & 1]:
                self.assertTrue(m.adjacent(src, {'x': x + dx, 'y': 50 + dy}))
            self.assertFalse(m.adjacent(src, {'x': x + 2, 'y': 50}))

    def test_retention_floor_minimum_commander_and_all_weapon_types(self):
        for charm in (None, 0, 49, 50, 59, 60, 100, 255):
            state, cmd, pol, _ = fixture()
            state['source']['commanderCharm'] = charm
            got = run(state, cmd, pol)
            pct = max(5, charm // 10 if charm is not None else 5)
            self.assertEqual(got['events'][0]['percent'], pct)
            for key in ('gold', 'food', 'troops'):
                self.assertEqual(got['after']['base']['resources'][key], state['base']['resources'][key] * pct // 100)
            self.assertEqual(got['after']['base']['resources']['weapons'], [x * pct // 100 for x in state['base']['resources']['weapons']])

    def test_directed_relationship_gate_invalid_same_alliance_truce(self):
        state, cmd, pol, _ = fixture()
        relation = cmd['relationship']
        for valid_s in (False, True):
            for valid_t in (False, True):
                for same in (False, True):
                    for allied in (False, True):
                        for truce in (0, 1, 255):
                            r = dict(relation, sourceValid=valid_s, targetValid=valid_t,
                                     sourceForceId=1 if same else 2, allied=allied, truce=truce)
                            self.assertEqual(m.relationship_blocked(r), valid_s and valid_t and (same or allied or truce > 0))

    def test_destruction_unlinks_before_selection_and_refreshes_retained_owner(self):
        state, cmd, pol, add = fixture()
        add(200, 30, state=0)
        add(201, 30)
        for i in range(202, 235): add(i, 6)
        got = run(state, cmd, pol)
        world = got['after']['world']
        self.assertNotIn(200, [row['id'] for row in world['buildings']])
        self.assertIn(201, [row['id'] for row in world['buildings']])
        self.assertTrue(all(row['forceId'] == 2 for row in world['buildings']))
        phases = [e['phase'] for e in got['events']]
        self.assertLess(phases.index('treasure42-reset-request'), phases.index('immediate-facility-destruction'))
        self.assertLess(phases.index('immediate-facility-destruction'), phases.index('selector-destruction'))
        self.assertIn('treasure42-reset-event-only-v1', [x['id'] for x in got['fallbacks']])

    def test_entry_rejects_unresolved_commander_or_owner_change_context(self):
        for key, value in (('commanderCharm', None), ('entryProfile', 'unresolved')):
            state, cmd, pol, _ = fixture()
            state['source'][key] = value
            cmd['entryRangePass'] = True
            with self.assertRaises(ValueError): run(state, cmd, pol)

    def test_retained_troops_zero_resets_morale(self):
        state, cmd, pol, _ = fixture()
        state['base']['resources']['troops'] = 1
        self.assertEqual(run(state, cmd, pol)['after']['base']['morale'], 0)

    def test_normal_owner_new_max_cap_then_half_floor(self):
        for initial, old_tech, new_tech, expected in ((0, False, True, 4000),
                (7000, True, False, 5000), (1500, False, False, 2500),
                (4500, False, False, 4500), (0, False, False, 2500)):
            state, cmd, pol, _ = fixture()
            state['base']['tech26'] = old_tech
            state['source']['tech26'] = new_tech
            state['base']['durability'] = initial
            if initial:
                state['base']['resources']['troops'] = 0
            got = run(state, cmd, pol)
            self.assertEqual(got['after']['base']['durability'], expected)
        state, cmd, pol, _ = fixture()
        state['base']['intrinsicMaxDurability'] = 5001
        self.assertEqual(run(state, cmd, pol)['after']['base']['durability'], 2500)

    def test_neutral_finalizer_erases_retention_fire_governor_and_flags(self):
        for reason in ('forceValid', 'legionValid', 'specialForce'):
            state, cmd, pol, _ = fixture()
            if reason == 'specialForce':
                state['source']['forceId'] = 42
                state['source']['legionForceId'] = 42
                cmd['relationship']['sourceForceId'] = 42
            else:
                state['source'][reason] = False
            got = run(state, cmd, pol)
            base = got['after']['base']
            self.assertGreater(got['events'][0]['after']['gold'], 0)
            self.assertEqual(base['resources'], {'gold': 0, 'food': 0, 'troops': 0, 'weapons': [0] * 12})
            self.assertEqual((base['forceId'], base['legionId'], base['fire'], base['governorId'], base['cityQueueId']), (-1, -1, 0, -1, -1))
            self.assertEqual(base['cityFlags'], 0xec)
            self.assertEqual(base['durability'], 2500)

    def test_force_override_runs_rng_before_all_destruction(self):
        state, cmd, pol, _ = fixture()
        state['source']['forceId'] = 46
        state['source']['legionForceId'] = 46
        cmd['relationship']['sourceForceId'] = 46
        got = run(state, cmd, pol, raw_draws=[0, 1, 2])
        self.assertEqual(got['selector']['outcome']['rngCallCount'], 3)
        self.assertEqual(got['selector']['outcome']['destroyedIds'], [102, 100, 101])

    def test_normal_retains_fire_clears_only_changed_owner_flags_public_order_leader(self):
        state, cmd, pol, _ = fixture()
        state['source']['commanderCharm'] = 20
        state['source']['legionLeaderCharm'] = 99
        got = run(state, cmd, pol)
        base = got['after']['base']
        self.assertEqual((base['publicOrder'], base['fire'], base['cityFlags'], base['cityQueueId']), (89, 3, 0xec, 9))
        for charm, old, expected in ((None, 0, 70), (0, 95, 95), (255, 50, 100)):
            state['source']['legionLeaderCharm'] = charm
            state['base']['publicOrder'] = old
            self.assertEqual(run(state, cmd, pol)['after']['base']['publicOrder'], expected)

    def test_same_force_ownership_branch_skips_public_order_and_caps(self):
        state, cmd, pol, _ = fixture()
        state['source']['forceId'] = 1
        state['source']['legionForceId'] = 1
        cmd['caller'] = 'trap'  # Relation arg4 stays force2; source arg3 is force1.
        pol['normalCaps']['gold'] = 1
        got = run(state, cmd, pol)
        self.assertEqual(got['after']['base']['resources']['gold'], 600)
        self.assertEqual(got['after']['base']['publicOrder'], 20)
        self.assertEqual(got['after']['base']['cityFlags'], 0xff)

    def test_entry_weight_uses_full_incoming_before_troop_clamp(self):
        state, cmd, pol, _ = fixture()
        cmd['entryRangePass'] = True
        pol['normalCaps']['troops'] = 80
        src = state['source']
        src['cargo'][0] = {'weaponId': 6, 'amount': 60}
        src['cargo'][1] = {'weaponId': 6, 'amount': 60}
        src['cargo'][2] = {'weaponId': 99, 'amount': 300}
        got = run(state, cmd, pol)
        base = got['after']['base']
        # Retained59*70, incoming100*90; all100 incoming contribute despite cap80.
        self.assertEqual(base['morale'], (59 * 70 + 100 * 90) // 159)
        self.assertEqual(base['resources']['troops'], 80)
        self.assertEqual(base['resources']['weapons'][6], 100)
        entry = next(e for e in got['events'] if e['phase'] == 'troop-entry')
        self.assertEqual(entry['additions'][2]['discarded'], 79)
        self.assertEqual(entry['additions'][3]['added'], 60)
        self.assertEqual(entry['additions'][4]['added'], 35)
        self.assertEqual(entry['additions'][5]['ignored'], 300)
        self.assertTrue(got['after']['source']['removed'])

    def test_entry_zero_denominator_and_zero_cap(self):
        for incoming in (0, 100):
            state, cmd, pol, _ = fixture()
            state['base']['resources']['troops'] = 0
            state['source']['troops'] = incoming
            pol['normalCaps']['troops'] = 0
            cmd['entryRangePass'] = True
            got = run(state, cmd, pol)
            self.assertEqual(got['after']['base']['morale'], 0)

    def test_explicit_entry_skip_reject_and_unknown_effect_policies(self):
        state, cmd, pol, _ = fixture()
        cmd['entryRangePass'] = True
        pol['troopEntry'] = 'skip'
        got = run(state, cmd, pol)
        self.assertFalse(got['after']['source']['removed'])
        self.assertIn('troop-entry-explicitly-skipped-v1', [x['id'] for x in got['fallbacks']])
        pol['troopEntry'] = 'reject'
        self.assertFalse(run(state, cmd, pol)['accepted'])
        pol['unknownEffects'] = 'reject'
        self.assertFalse(run(state, cmd, pol)['accepted'])

    def test_invalid_unmodelled_caller_gates_and_duplicate_no_rng(self):
        for field in ('allied', 'upstreamEligible'):
            state, cmd, pol, _ = fixture()
            if field == 'allied': cmd['relationship']['allied'] = True
            else: cmd[field] = False
            with patch.object(s, 'engineering_draws', side_effect=AssertionError('unexpected RNG')):
                got = run(state, cmd, pol)
            self.assertFalse(got['accepted'])
            self.assertEqual(got['after'], state)
        state, cmd, pol, _ = fixture()
        got = run(state, cmd, pol)
        duplicate = run(got['after'], cmd, pol)
        self.assertEqual(duplicate['reason'], 'duplicate-transaction')
        cmd['id'] = 'capture-2'
        self.assertEqual(run(got['after'], cmd, pol)['reason'], 'stale-revision')

    def test_revision_exhaustion_rejects_before_rng(self):
        state, cmd, pol, _ = fixture()
        state['revision'] = cmd['expectedRevision'] = 2**31 - 1
        with patch.object(s, 'engineering_draws', side_effect=AssertionError('unexpected RNG')):
            got = run(state, cmd, pol)
        self.assertEqual(got['reason'], 'revision-exhausted')
        self.assertEqual(got['after'], state)
        self.assertEqual(m.replay_capture_transaction(got, state, cmd, pol), got)

    def test_duplicate_and_stale_after_entry_ignore_old_revision_cap(self):
        state, cmd, pol, _ = fixture(42)
        pol['oldCaps']['troops'] = 1000
        pol['normalCaps']['troops'] = 60000
        state['source']['troops'] = 50000
        cmd['entryRangePass'] = True
        got = run(state, cmd, pol)
        self.assertEqual(got['after']['base']['resources']['troops'], 50059)
        self.assertEqual(run(got['after'], cmd, pol)['reason'], 'duplicate-transaction')
        cmd['id'] = 'new'
        self.assertEqual(run(got['after'], cmd, pol)['reason'], 'stale-revision')

    def test_unsupported_entry_preflight_consumes_no_rng(self):
        state, cmd, pol, _ = fixture()
        cmd['entryRangePass'] = True
        state['source']['commanderCharm'] = None
        with patch.object(s, 'engineering_draws', side_effect=AssertionError('unexpected RNG')):
            with self.assertRaises(ValueError): run(state, cmd, pol)

    def test_special_force_range_does_not_trigger_entry_reject(self):
        state, cmd, pol, _ = fixture()
        state['source']['forceId'] = state['source']['legionForceId'] = 42
        cmd['relationship']['sourceForceId'] = 42
        cmd['entryRangePass'] = True
        pol['troopEntry'] = 'reject'
        got = run(state, cmd, pol)
        self.assertTrue(got['accepted'])
        self.assertIn('special-force-entry-record-only-v1', [x['id'] for x in got['fallbacks']])

    def test_gate_port_cannot_own_domestic_through_invalid_city_byte(self):
        for target in (42, 52):
            state, cmd, pol, _ = fixture(target)
            state['world']['regionCityIds'][1] = target
            got = run(state, cmd, pol)
            self.assertEqual([x['forceId'] for x in got['after']['world']['buildings'][1:]], [3, 1, 1])

    def test_source_non_troop_explicit_default_charm(self):
        state, cmd, pol, _ = fixture(caller='fire')
        state['source']['kind'] = 'other'
        state['source']['commanderCharm'] = None
        got = run(state, cmd, pol)
        self.assertEqual(got['events'][0]['percent'], 5)
        self.assertEqual(got['selector']['outcome']['keepCount'], 1)
        cmd['caller'] = 'attack'
        self.assertFalse(run(state, cmd, pol)['accepted'])

    def test_atomicity_and_replay_without_rng_after_json_roundtrip(self):
        state, cmd, pol, _ = fixture()
        originals = copy.deepcopy((state, cmd, pol))
        for rng in ({'seed': 'fixture'}, {'source_rng_state': 12345}, {'raw_draws': [2, 0, 1]}):
            got = run(state, cmd, pol, **rng)
            loaded = json.loads(m.save_trace(got))
            with patch.object(s, 'engineering_draws', side_effect=AssertionError('RNG called')), \
                 patch.object(s, 'source_lcg_draws', side_effect=AssertionError('RNG called')):
                self.assertEqual(m.replay_capture_transaction(loaded, state, cmd, pol), got)
        self.assertEqual((state, cmd, pol), originals)

    def test_rejected_and_port_replay(self):
        for target, reject in ((42, False), (0, True)):
            state, cmd, pol, _ = fixture(target)
            cmd['relationship']['allied'] = reject
            got = run(state, cmd, pol)
            self.assertEqual(m.replay_capture_transaction(got, state, cmd, pol), got)

    def test_replay_binds_all_inputs_order_policy_and_outcome(self):
        state, cmd, pol, _ = fixture()
        got = run(state, cmd, pol)
        for change in ('state', 'command', 'policy', 'outcome', 'hash', 'extra', 'profile'):
            a, b, c, t = copy.deepcopy((state, cmd, pol, got))
            if change == 'state':
                a['world']['buildings'][1:3] = reversed(a['world']['buildings'][1:3])
            elif change == 'command': b['entryRangePass'] = True
            elif change == 'policy': c['normalCaps']['gold'] -= 1
            elif change == 'outcome': t['after']['base']['durability'] += 1
            elif change == 'hash': t['traceHash'] = '0' * 64
            elif change == 'extra': t['extra'] = True
            else: t['profileId'] = 'stock-original'
            with self.assertRaises(ValueError, msg=change):
                m.replay_capture_transaction(t, a, b, c)

    def test_validation_rejects_invalid_data_and_preserves_inputs(self):
        mutators = [lambda a,b,c: a['base'].__setitem__('morale', True),
                    lambda a,b,c: a['world']['buildings'].append(copy.deepcopy(a['world']['buildings'][0])),
                    lambda a,b,c: a['world']['mapCells'].clear(),
                    lambda a,b,c: a['world']['typeClasses'].__setitem__(0, 4),
                    lambda a,b,c: a['base'].__setitem__('forceId', 7),
                    lambda a,b,c: a['source'].__setitem__('cargo', []),
                    lambda a,b,c: c.__setitem__('ruleset', 'Vanilla'),
                    lambda a,b,c: c.__setitem__('unknownEffects', 'silent'),
                    lambda a,b,c: b.__setitem__('caller', 'surrender'),
                    lambda a,b,c: a['base']['resources'].__setitem__('gold', 100001)]
        for mutate in mutators:
            state, cmd, pol, _ = fixture()
            mutate(state, cmd, pol)
            before = copy.deepcopy((state, cmd, pol))
            with self.assertRaises(ValueError): run(state, cmd, pol)
            self.assertEqual((state, cmd, pol), before)

    def test_vanilla_is_separate_assumption_and_console_rejected(self):
        state, cmd, pol, _ = fixture()
        self.assertEqual(run(state, cmd, pol)['evidence']['runtimeStatus'], 'compatibility-reconstruction')
        pol['ruleset'] = 'PC-Vanilla-assumption'
        self.assertEqual(run(state, cmd, pol)['evidence']['runtimeStatus'], 'compatibility-assumption')
        pol['ruleset'] = 'PS2'
        with self.assertRaises(ValueError): run(state, cmd, pol)

    def test_bounded_property_matrix(self):
        for base_id in (0, 42, 52):
            for charm in (0, 49, 50, 99, 255):
                for new_force in (-1, 0, 41, 42, 46):
                    for new_tech in (False, True):
                        state, cmd, pol, _ = fixture(base_id)
                        src = state['source']
                        src.update(forceId=new_force, legionForceId=new_force, commanderCharm=charm, tech26=new_tech)
                        cmd['relationship']['sourceForceId'] = new_force
                        got = run(state, cmd, pol)
                        base = got['after']['base']
                        maximum = 5000 + (3000 if 0 <= new_force <= 41 and new_tech else 0)
                        self.assertGreaterEqual(base['durability'], maximum // 2)
                        self.assertLessEqual(base['durability'], maximum)
                        self.assertEqual(len(base['resources']['weapons']), 12)
                        self.assertFalse(got['evidence']['stockOriginalVerified'])
                        self.assertGreater(got['fallbackCount'], 0)
                        self.assertEqual(m.replay_capture_transaction(got, state, cmd, pol), got)


class CaptureEvidenceChecks(unittest.TestCase):
    def test_committed_ranges_hashes_source_identity_comparisons_and_opcodes(self):
        data = json.loads((ROOT / 'docs/sources/capture-transaction-source-profile.json').read_text())
        self.assertFalse(data['stockOriginalVerified'])
        self.assertFalse(data['originalExecutableExecuted'])
        self.assertEqual(data['profileId'], m.PROFILE_ID)
        self.assertIn('血色5.0', data['sourceProfiles'][0]['inputPath'])
        self.assertIn('血色衣冠6.0', data['sourceProfiles'][1]['inputPath'])
        blobs, instructions = {}, {}
        for row in data['functions']:
            raw = bytearray()
            cursor = int(row['start'], 16)
            path = ROOT / 'docs/sources/capture-transaction-source-profile' / row['disassembly']
            for line in path.read_text().splitlines():
                match = re.match(r'^([0-9A-F]{8})\s+((?:[0-9a-f]{2} )*[0-9a-f]{2})\s+[a-z]', line)
                self.assertIsNotNone(match, line)
                address = int(match[1], 16)
                fragment = bytes.fromhex(match[2])
                self.assertEqual(address, cursor)
                instructions[address] = fragment
                raw.extend(fragment)
                cursor += len(fragment)
            self.assertEqual(cursor, int(row['endExclusive'], 16))
            self.assertEqual(len(raw), row['byteCount'])
            self.assertEqual(hashlib.sha256(raw).hexdigest(), row['rawSha256'])
            blobs[row['start']] = bytes(raw)
        for row in data['dataWindows']:
            raw = bytes.fromhex(row['bytesHex'])
            self.assertEqual(len(raw), row['byteCount'])
            self.assertEqual(hashlib.sha256(raw).hexdigest(), row['sha256'])
            blobs[row['address']] = raw
        for row in data['sourceComparisons']:
            a, b = blobs[row['address']], bytes.fromhex(row['s2BytesHex'])
            self.assertEqual((len(a), len(b)), (row['s1Length'], row['s2Length']))
            self.assertEqual(hashlib.sha256(a).hexdigest(), row['s1Sha256'])
            self.assertEqual(hashlib.sha256(b).hexdigest(), row['s2Sha256'])
            self.assertEqual(a == b, row['identical'])
        self.assertEqual(len(data['sourceComparisons']), 24)
        self.assertEqual(sum(r['identical'] for r in data['sourceComparisons']), 17)
        offsets = list(struct.iter_unpack('<hh', blobs['0079C310']))
        self.assertEqual(tuple(offsets[:6]), m.HEX_NEIGHBORS[0])
        self.assertEqual(tuple(offsets[6:]), m.HEX_NEIGHBORS[1])
        # Literal arguments, source-local branch gates and exact direct calls.
        for address, expected in {
            0x005926D3: '6a 01', 0x00597E8B: '6a 01',
            0x005B1BEA: '0f 94 c1', 0x004B364D: '0f bf 47 10',
            0x004B3651: 'd1 ee', 0x0047A81C: '81 c7 b8 0b 00 00',
            0x004B34DE: '83 f8 1e', 0x004B34D5: '83 f8 1e',
            0x004B4966: '3b c3', 0x004B48D8: '04 46',
            0x00487F0D: 'c1 e8 05',
        }.items():
            self.assertEqual(instructions[address], bytes.fromhex(expected), hex(address))
        for address, target in ((0x005926DC, 0x004B2CA0), (0x00597E94, 0x004B2CA0),
            (0x005B1BF5, 0x004B2CA0), (0x004B3180, 0x004B1280),
            (0x004B35BD, 0x004B40C0), (0x004B35C9, 0x004B49B0),
            (0x004B3624, 0x004BF1F0), (0x004B363E, 0x004BCA30),
            (0x004B4A87, 0x004AE0A0), (0x004AE0BE, 0x004AD550),
            (0x004AE13E, 0x00487E50), (0x004BF64F, 0x00588CB0),
            (0x004B34BF, 0x004A0F00), (0x00487F14, 0x004839F0)):
            raw = instructions[address]
            self.assertEqual(raw[0], 0xe8)
            self.assertEqual(address + 5 + int.from_bytes(raw[1:], 'little', signed=True), target)


if __name__ == '__main__':
    unittest.main(verbosity=2)
