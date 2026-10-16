import scenario from '../../data/scenarios/city-command-example-v1.json' with { type: 'json' };
import { createCityCommandState, previewCityCommand, executeCityCommand, saveCityCommandState, loadCityCommandState, replayCityCommands } from '../../packages/engine/src/index.ts';
const commands = [
  { type:'Patrol', cityId:'cityA', officerIds:['o1','o2','o3'] },
  { type:'Recruit', cityId:'cityA', officerIds:['o4','o5','o6'], facilityId:'b1' },
  { type:'Produce', cityId:'cityA', officerIds:['o7','o8','o9'], facilityId:'f1', equipmentType:1 },
  { type:'Produce', cityId:'cityA', officerIds:['o10','o11','o12'], facilityId:'w1', equipmentType:5 },
  { type:'AdvanceCityTurn' }, { type:'AdvanceCityTurn' },
];
let state = createCityCommandState(scenario);
if (state.ok === false) throw new Error(state.reason);
const steps=[];
for (const [i, command] of commands.entries()) {
  const envelope={ id:'example:'+i, expectedRevision:state.revision, command };
  const preview=previewCityCommand(state,envelope); if (!preview.ok) throw new Error(preview.reason);
  const result=executeCityCommand(state,envelope); if (!result.ok) throw new Error(result.reason);
  state=result.state; steps.push({envelope,expected:{ok:true,duplicate:false,receipt:result.receipt}});
  if(i===3) { const saved=saveCityCommandState(state);if(!saved.ok)throw new Error(saved.reason);state=loadCityCommandState(saved.serialized);if(state.ok===false)throw new Error(state.reason); }
}
const replay=replayCityCommands({tag:'san11-city-command-trace-v1',initialScenario:scenario,steps,expectedFinalDigest:null});
if(!replay.ok)throw new Error(replay.reason);
const summary={revision:state.revision,turn:state.turn,date:state.date,gold:state.city.gold,actionPoints:state.corps.actionPoints,troops:state.city.troops,security:state.city.security,morale:state.city.morale,quantityStock:state.city.inventory[1].quantity,pieceStock:state.city.inventory[5].quantity,completedJobs:state.productionJobs.filter(j=>j.status==='completed').length,replayMatches:saveCityCommandState(state).serialized===saveCityCommandState(replay.state).serialized};
console.log(JSON.stringify(summary,null,2));
