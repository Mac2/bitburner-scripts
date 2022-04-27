/**
 * Total Ways to Sum
 *
 * It is possible to write four as a sum in exactly four different ways:
 *
 *     3 + 1
 *     2 + 2
 *     2 + 1 + 1
 *     1 + 1 + 1 + 1
 *
 * How many different ways can the number 9 be written as a sum of at least two
 * positive integers?
 *
 **/
import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns) {
  const codingContractor = new CodingContractWrapper(ns)
  const answer = solve(await codingContractor.extractData())
  await codingContractor.sendSolution(answer)
}

// solution from https://github.com/alainbryden/bitburner-scripts/blob/main/Tasks/contractor.js.solver.js
function solve(data) {

  const n = data[0];
  const s = data[1];
  const ways = [1];
  ways.length = n + 1;
  ways.fill(0, 1);
  for (let i = 0; i < s.length; i++) {
    for (let j = s[i]; j <= n; j++) {
      ways[j] += ways[j - s[i]];
    }
  }
  return ways[n];
}
