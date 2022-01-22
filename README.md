# netwalk
The source code for netwalkgame.com

### About
I started this project as a way to learn about basic web development (HTML/CSS/Javascript). Prior to this, my programming experience mainly consisted of Java. I've always enjoyed playing puzzle games such as Minesweeper and this seemed like perfect opportunity to create another game that I could play while watching lectures. This project was a lot of fun and it has also allowed me to learn a bit about Node, Firebase, website hosting and Google Cloud Functions. 

Unfortunately the commit history is quite bare as this project was originally done without version control in 2020 (partially because I didn't expect to finish it). However, I have since become more familiar with git and more recent projects such as parallel-scheduler was developed using version control from the start.

### How it works
The way the puzzle generation works is by starting at a completed puzzle then rotating each tile a random number of times. The method to generate a completed puzzle is slightly complicated. In order to do this, we need to represent the tiles and their connections as a graph. This means each tile can be represented by a vertex and each vertex is connected by edges to their four adjacent tiles. This means that the final complete puzzle forms a spanning tree. In order to create a random spanning tree, I use a method inspired by [Prim's Algorithm](https://en.wikipedia.org/wiki/Prim%27s_algorithm): 

* Initialise a graph G which contains all the tiles represented as vertices where each vertex connects to four other vertices (which represent the adjacent tiles). 

* Initialise a tree T which contains a single vertex from G. 

* Pick a random vertex, V1, from G which is also in T, then pick a random edge E from V1 that connects to another vertex, V2, in G. 

* If V2 is not currently in T then add E and V2 to T. If T contains all the vertices from G then T is a spanning tree and we are done, otherwise go back to the previous step.

### Things to consider for the future
Currently, submissions to the leaderboard do not require any form of verification. This allows for players to spoof scores by simply writing to the public database. I've currently set up the database to automatically reset every week so that the leaderboard does not get filled with fake scores. However, to properly combat this issue would require users to sign up (which is unlikely to be implemented as I am no longer actively working on this project).
