import React, { useEffect, useState } from 'react';
import Spotify from 'spotify-web-api-js';

import Playlist from './components/Playlist';

function getHashParams() {
  var hashParams = {};
  var e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
  while ( e = r.exec(q)) {
     hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

function App() {

  const [userId, setUserId] = useState(null);
  const [params, setParams] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [playlists, setPlaylists] = useState(null)
  const [incorrect, setIncorrect] = useState(false);
  const [selected, setSelected] = useState(false);
  const [numSongs, setNumSongs] = useState("5");
  const [playlistName, setPlaylistName] = useState("");
  const [newPlaylistID, setNewPlaylistID] = useState(null);
  const [selectedPlaylists, setSelectedPlaylists] = useState([]);

  const SpotifyWebAPI = new Spotify();
  var size = 100;

  useEffect(() => {
    setParams(getHashParams());
  }, [])

  useEffect(() => {
    if (params) {
      if (params.access_token) {
        setLoggedIn(true);
        SpotifyWebAPI.setAccessToken(params.access_token);
        SpotifyWebAPI.getMe()
        .then(
          function(data) {
            setUserId(data.id);
          },
          function(err) {
            console.error(err);
          }
        )
      }
    }
  }, [params]);

  useEffect(() => {
    if (userId) {
      SpotifyWebAPI.getUserPlaylists(userId, {limit:50})
      .then(
        function(data) {
          setPlaylists(data.items);
        },
        function(err) {
          console.error(err)
        }
      )
    }
  }, [userId, selected])

  function handleSelect(id) {
    let temp = new Set(selectedPlaylists);
    if (temp.has(id)) {
      temp.delete(id);
    } else {
      temp.add(id);
    }
    setSelectedPlaylists(Array.from(temp));
  }

  function numChange(event) {
    setNumSongs(event.target.value);
  }

  function nameChange(event) {
    setPlaylistName(event.target.value);
  }

  function handleReady() {
    if (selectedPlaylists.length > 1){
      setSelected(true);
      setIncorrect(false);
    } else {
      setIncorrect(true);
    }
  }

  async function createPlaylist() {
    let options = {
      name: playlistName,
      description: "This playlist was created with Mergify"
    }
    await SpotifyWebAPI.createPlaylist(userId, options)
    .then(
      function(data) {
        setNewPlaylistID(data.id);
        addSongs(data.id);

        setSelectedPlaylists([])
        setSelected(false);
      },
      function(err) {
        console.error(err);
      }
    )
  }

  async function addSongs(playlistID) {
    const newSongs = new Set();
    for (let playlistID of selectedPlaylists) {
      let currPlaylist = [];
      let index = 0;
      size = 100;
      while (size === 100) {
        let list = [];
        await SpotifyWebAPI.getPlaylistTracks(playlistID, {fields: "items(track(uri), is_local)", limit:100, offset: index})
        .then(data => list = data.items)
        list.forEach(item => {
          if (!item.is_local) {
            currPlaylist.push(item.track.uri);
          }
        });
        size = list.length;
        index = index + size;
        if (index > 5000) {
          break;
        }
      }
      if (numSongs === "all") {
        currPlaylist.forEach(item => newSongs.add(item));
      } else {
        let max = parseInt(numSongs)
        for (let i = 0; i < max; i++) {
          let rand = Math.floor(Math.random() * currPlaylist.length);  
          newSongs.add(currPlaylist[rand]);
        }
      }
    }
    let arrayNewSongs = Array.from(newSongs);
    let temp = []
    while (arrayNewSongs.length > 0) {
      temp = arrayNewSongs.splice(0, Math.min(arrayNewSongs.length, 100));
      SpotifyWebAPI.addTracksToPlaylist(playlistID, temp);
    }
  }

  return (
    <div id = "App" className="d-flex justify-content-center">
      {
        !loggedIn &&
        <div id ="login" className="d-flex flex-column w-50 align-items-center mt-5 pt-5 pb-5">
          <h1>Mergify</h1>
          <p className="mt-3">The easiest way to merge Spotify playlists</p>
          <a href = "http://localhost:9000/api/login">
            <button type="button" className="btn btn-success mt-5">Login to Spotify</button>
          </a>
        </div>
      }
      {
        playlists && !selected &&
        <div id = "playlists" className= "d-flex flex-column align-items-center m-5 p-4">
          <h1>Mergify</h1>
          <form id = "playlistForm" className="d-flex flex-column align-items-center mt-3">
            <div className = "d-flex flex-row justify-content-between align-items-center w-75 mb-3" style = {{height: "20px"}}>
              <p>Select your playlists that you want to combine</p>
              <button type = "button" className= {selectedPlaylists.length < 1 ? "hide btn btn-success" : "btn btn-success"}  onClick = {handleReady}>Create your playlist</button>
            </div>
            {
              incorrect
              ? <div style = {{background: "#E57373", color:"EF5350"}}><p>Please select more than one playlist</p></div>
              :<></>
            }
            <div id = "checkboxes" className="d-flex flex-wrap justify-content-center w-100">
              {
                playlists.map(playlist => (
                  <Playlist key = {playlist.id} id = {playlist.id} name = {playlist.name} handleSelect = {handleSelect}></Playlist>
                ))
              }
            </div>
          </form>
        </div>
      }
      {
        selected &&
        <div id = "selected" className= "d-flex flex-column align-items-center m-5 p-4">
          <h1>Mergify</h1>
          <form className="d-flex flex-column mt-3">
            <div className="d-flex flex-row justify-content-center">
              <p className="mr-3">How many songs would you like to include from each playlist?</p>
              <select onChange = {numChange}>
                <option value ="5">5</option>
                <option value ="10">10</option>
                <option value ="20">20</option>
                <option value ="all">All of them</option>
              </select>
            </div>
            <div className="d-flex flex-row justify-content-center mt-3">
              <p className="mr-3">Playlist Name:</p>
              <input type="text" onChange = {nameChange}></input>
            </div>
            <button type = "button" className="btn btn-success mt-5" onClick = {createPlaylist}>Create your playlist!</button>
          </form>
        </div>
      }
    </div>
  );
}

export default App;
