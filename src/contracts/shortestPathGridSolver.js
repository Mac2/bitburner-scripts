/**
 Shortest Path in a Grid

You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.
You are located in the top-left corner of the following grid:

  [[0,0,0,0,0,0,0,1],
   [0,0,0,1,1,1,1,1],
   [0,0,1,0,0,0,0,0],
   [0,0,0,0,1,0,0,1],
   [0,0,1,1,0,0,0,0],
   [0,1,1,0,0,0,0,0],
   [0,0,1,0,0,0,0,0]]

You are trying to find the shortest path to the bottom-right corner of the grid, but there are obstacles on the grid that you cannot move onto. These obstacles are denoted by '1', while empty spaces are denoted by 0.

Determine the shortest path from start to finish, if one exists. The answer should be given as a string of UDLR characters, indicating the moves along the path

NOTE: If there are multiple equally short paths, any of them is accepted as answer. If there is no path, the answer should be an empty string.
NOTE: The data returned for this contract is an 2D array of numbers representing the grid.

Examples:

    [[0,1,0,0,0],
     [0,0,0,1,0]]

Answer: 'DRRURRD'

    [[0,1],
     [1,0]]

Answer: ''
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

        //slightly adapted and simplified to get rid of MinHeap usage, and construct a valid path from potential candidates   
        //MinHeap replaced by simple array acting as queue (breadth first search)  
        const width = data[0].length;
        const height = data.length;
        const dstY = height - 1;
        const dstX = width - 1;
  
        const distance = new Array(height);
        //const prev: [[number, number] | undefined][] = new Array(height);
        const queue = [];
  
        for (let y = 0; y < height; y++) {
            distance[y] = new Array(width).fill(Infinity);
            //prev[y] = new Array(width).fill(undefined) as [undefined];
        }
  
        function validPosition(y, x) {
            return y >= 0 && y < height && x >= 0 && x < width && data[y][x] == 0;
        }
  
        // List in-bounds and passable neighbors
        function* neighbors(y, x) {
            if (validPosition(y - 1, x)) yield [y - 1, x]; // Up
            if (validPosition(y + 1, x)) yield [y + 1, x]; // Down
            if (validPosition(y, x - 1)) yield [y, x - 1]; // Left
            if (validPosition(y, x + 1)) yield [y, x + 1]; // Right
        }
  
        // Prepare starting point
        distance[0][0] = 0;

        //## Original version
        // queue.push([0, 0], 0);
        // // Take next-nearest position and expand potential paths from there
        // while (queue.size > 0) {
        //   const [y, x] = queue.pop() as [number, number];
        //   for (const [yN, xN] of neighbors(y, x)) {
        //     const d = distance[y][x] + 1;
        //     if (d < distance[yN][xN]) {
        //       if (distance[yN][xN] == Infinity)
        //         // Not reached previously
        //         queue.push([yN, xN], d);
        //       // Found a shorter path
        //       else queue.changeWeight(([yQ, xQ]) => yQ == yN && xQ == xN, d);
        //       //prev[yN][xN] = [y, x];
        //       distance[yN][xN] = d;
        //     }
        //   }
        // }

        //Simplified version. d < distance[yN][xN] should never happen for BFS if d != infinity, so we skip changeweight and simplify implementation
        //algo always expands shortest path, distance != infinity means a <= lenght path reaches it, only remaining case to solve is infinity    
        queue.push([0, 0]);
        while (queue.length > 0) {
            const [y, x] = queue.shift()
            for (const [yN, xN] of neighbors(y, x)) {
                const d = distance[y][x] + 1
                if (distance[yN][xN] == Infinity){
                    queue.push([yN, xN]);
                    distance[yN][xN] = d;
                }
            }
        }

        // No path at all?
        if (distance[dstY][dstX] == Infinity) return "";

        //trace path back to start
        let path = ""
        let [yC, xC] = [dstY, dstX]
        while (xC != 0 || yC != 0){
            const dist = distance[yC][xC];
            for (const [yF, xF] of neighbors(yC, xC)) {
                if (distance[yF][xF] == dist - 1){
                    path = ( xC == xF  ? (yC == yF + 1 ? "D" : "U") : (xC == xF + 1 ? "R" : "L") ) + path;                    
                    [yC, xC] = [yF, xF]
                    break
                }
            }            
        }        
        return path;
}
