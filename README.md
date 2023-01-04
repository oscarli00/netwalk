# netwalk
The source code for netwalkgame.com

## About
I started this project as a way to learn about basic web development (HTML/CSS/Javascript) as well as Node, Firebase, website hosting and Google Cloud Functions.  Unfortunately the commit history is quite bare as this project was originally done without version control in 2020.

## How it works
The way the puzzle generation works is by starting with a completed board then rotating each tile a random number of times. The tiles and their connections are represented as a graph where each tile is a vertex and connections between tiles are edges. As a result, the final complete puzzle forms a spanning tree. A method inspired by [Prim's Algorithm](https://en.wikipedia.org/wiki/Prim%27s_algorithm) is used to generate random spanning trees: 

* Initialise a graph G which contains all the tiles represented as vertices where each vertex connects to four other vertices (which represent the adjacent tiles). 

* Initialise a tree T which contains a single vertex from G. 

* Pick a random vertex, V1, from G which is also in T, then pick a random edge E from V1 that connects to another vertex, V2, in G. 

* If V2 is not currently in T then add E and V2 to T. If T contains all the vertices from G then T is a spanning tree and we are done, otherwise go back to the previous step.
