const test=require("node:test");
const assert=require("node:assert/strict");
const {plan,assessLearning}=require("../js/learning-loop.js");
test("observed motif yields practice rather than an assumed cause",()=>{
  const reports=[1,2,3].map(ply=>({ply,color:"w",san:"a3",diagnostics:[
    {code:"PIECE_EN_PRISE_EN_UN_COUP",square:"d1"}
  ]}));
  const r=plan({reports});
  assert.equal(r.length,1);
  assert.equal(r[0].count,3);
  assert.equal(r[0].confidence,"insufficient_evidence");
  assert.equal(r[0].status,"PRACTICE_RECOMMENDATION_NOT_PROVEN_CAUSE");
  assert.ok(r[0].exercisesToTry>=3);
});
test("matched difficulty and sufficiently large samples are required",()=>{
  const a={sampleN:10,errors:5,timeControl:"3+2",difficulty:"L5"};
  const b={sampleN:30,errors:3,timeControl:"3+2",difficulty:"L5"};
  assert.equal(assessLearning(a,b).status,"INSUFFICIENT_COMPARABLE_DATA");
  a.sampleN=30;
  assert.equal(assessLearning(a,b).status,"MEASURED_CHANGE_NOT_CAUSAL_PROOF");
  b.difficulty="L6";
  assert.equal(assessLearning(a,b).status,"INSUFFICIENT_COMPARABLE_DATA");
});
