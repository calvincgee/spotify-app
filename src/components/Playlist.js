import React, { useEffect, useState } from 'react';
import Spotify from 'spotify-web-api-js';

function Playlist( props ) {

    const [image, setImage] = useState(null);
    const [selected, setSelected] = useState(false);

    let SpotifyWebApi = new Spotify();
    useEffect(() => {
        SpotifyWebApi.getPlaylistCoverImage(props.id)
        .then(
            function(data) {
                if (data.length > 0) {
                    setImage(data[0].url);
                }
            },
            function(err) {
                console.error(err);
            }
        )
    }, []);

    function handleClick() {
        setSelected(!selected);
        props.handleSelect(props.id);
    }

    return(
        <>
        <div className = {selected ? "selected playlistBox d-flex flex-column align-items-center p-1 m-2" : "unselected playlistBox d-flex flex-column align-items-center p-1 m-2"} onClick = {handleClick}>
            <input type="checkbox" name="Playlists" value = {props.id} id = {props.id}></input>
            {
                image &&
                <img src = {image} htmlFor = {props.id} height = "100" width = "100"></img>
            }
            <p style = {{width: "100px", textAlign:"center"}} htmlFor = {props.id}>{props.name}</p>
        </div>
        </>
    )
}

export default Playlist;