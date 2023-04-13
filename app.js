const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(
      (3000,
      () => {
        console.log("Server is running on http://localhost:3000/");
      })
    );
  } catch (e) {
    console.log(`Database Error is ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//Returns a list of all the players in the player table
//API 1

const camelCasePlayerList = (objectItem) => {
  return {
    playerId: objectItem.player_id,
    playerName: objectItem.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const getPlayersQueryResponse = await db.all(getPlayersQuery);
  response.send(
    getPlayersQueryResponse.map((eachItem) => camelCasePlayerList(eachItem))
  );
});

//Returns a specific player based on the player ID
// API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerIdQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const playerIdQueryResponse = await db.get(playerIdQuery);
  response.send(camelCasePlayerList(playerIdQueryResponse));
});

//Updates the details of a specific player based on the player ID
//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details SET player_name = '${playerName}';`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match
//API 4

const camelCaseMatchDetails = (objectItem) => {
  return {
    matchId: objectItem.match_id,
    match: objectItem.match,
    year: objectItem.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const matchDetailsResponse = await db.get(getMatchDetailsQuery);
  response.send(camelCaseMatchDetails(matchDetailsResponse));
});

//Returns a list of all the matches of a player
//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchesOfPlayerQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id = ${playerId}`;
  const matchesOfPlayerResponse = await db.all(matchesOfPlayerQuery);
  response.send(
    matchesOfPlayerResponse.map((eachItem) => camelCaseMatchDetails(eachItem))
  );
});

//Returns a list of players of a specific match
//API 6

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const playerMatchQuery = `SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const playerMatchQueryResponse = await db.all(playerMatchQuery);
  response.send(playerMatchQueryResponse);
});

///Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
//API 7

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const getPlayerScoredResponse = await db.get(getPlayerScored);
  response.send(getPlayerScoredResponse);
});

module.exports = app;
