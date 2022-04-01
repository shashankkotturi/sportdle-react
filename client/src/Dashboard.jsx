import React, { useState, useEffect } from "react"

import useAuth from "./hooks/useAuth"
import Player from "./Player"
import TrackSearchResult from "./TrackSearchResult"
import PlaylistSearchResult from "./PlaylistSearchResult"
import SpotifyWebApi from "spotify-web-api-node"
import axios from "axios"
import {
    DashboardContainer,
    SearchInput,
    ResultsContainer,
    LyricsContainer,
    PlayerContainer,
    UserNameInput,
    TitleText,
} from "./styles/Dashboard.styles"
import Math from "math"

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.REACT_APP_CLIENT_ID,
})

const Dashboard = ({ code }) => {
    const accessToken = useAuth(code)
    const [search, setSearch] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [playingTrack, setPlayingTrack] = useState()
    const [lyrics, setLyrics] = useState("")
    const[username, setUserName] = useState("")
    const[myPlaylists, setMyPlaylists] = useState([])
    const[myPlaylist, setMyPlaylist] = useState([])
    const[myGuesses, setMyGuesses] = useState(0)

    function chooseTrack(track) {
        console.log("Track playing now:", track)
        setPlayingTrack(track)
        setSearch("")
        setLyrics("")
    }

    function choosePlaylist(playlist) {
        setMyPlaylist(playlist)
        setSearch("")
        setLyrics("")
        setMyGuesses(0)
    }

    function checkGuess(guessTrack) {
        console.log("guessTrack:", guessTrack.uri)
        console.log("PlayingTrack:", playingTrack.uri)
        if(guessTrack.uri === playingTrack.uri) {
            console.log("# of tries to guess correctly:", myGuesses + 1)
            setMyGuesses(0)
            setMyPlaylist([])
            return
        }
        setMyGuesses(myGuesses + 1)
    }

    useEffect(() => {
        if(!playingTrack) return
        ; (async () => {
            console.log(playingTrack.title, playingTrack.artist)
            const {
                data: { lyrics },
            } = await axios.get(`${process.env.REACT_APP_BASE_URL}/lyrics`, {
                params: {
                    track: playingTrack.title,
                    artist: playingTrack.artist,
                },
            })
            setLyrics(lyrics)
        })()
    }, [playingTrack])

    useEffect(() => {
        if(!accessToken) return
        spotifyApi.setAccessToken(accessToken)
    }, [accessToken])

    useEffect(() => {
        if(!search) return setSearchResults([])
        if(!accessToken) return

        let cancel = false
        ;(async () => {
            const { body } = await spotifyApi.searchTracks(search)
            if (cancel) return
            setSearchResults(
                body.tracks.items.map(track => {
                    const smallestAlbumImage = track.album.images.reduce(
                        (smallest, image) => {
                            if(image.height < smallest.height) return image
                            return smallest
                        },
                        track.album.images[0]
                    )

                    return {
                        artist: track.artists[0].name,
                        title: track.name,
                        uri: track.uri,
                        albumUrl: smallestAlbumImage.url,
                    }
                })
            )
        })()

        return () => {cancel = true}
    }, [search, accessToken])

    useEffect(() => {
        if(!username) return setUserName("")
        if(!accessToken) return

        let cancel = false
        ;(async () => {
            const { body } = await spotifyApi.getUserPlaylists(username)
            if (cancel) return
            setMyPlaylists(
                body.items.map(playlist => {
                    return {
                        title: playlist.name,
                        description: playlist.description,
                        uri: playlist.uri,
                        image: playlist.images[0].url
                    }
                })
            )
        })()

        return () => {cancel = true}
    }, [username, accessToken])

    useEffect(() => {
        if(!myPlaylist) return setMyPlaylist([])
        if(!accessToken) return

        let cancel = false
        ;(async () => {
            const myPlaylist_uri = myPlaylist.uri ? myPlaylist.uri.split(":")[2] : ""
            const { body } = await spotifyApi.getPlaylistTracks(myPlaylist_uri)
            if (cancel) return
            const size = Object.keys(body.items).length
            const random = Math.floor(Math.random() * size)
            const track = body.items[random].track
            const smallestAlbumImage = track.album.images.reduce(
                (smallest, image) => {
                    if(image.height < smallest.height) return image
                    return smallest
                },
                track.album.images[0]
            )
            const random_track = {
                artist: track.artists[0].name,
                title: track.name,
                uri: track.uri,
                albumUrl: smallestAlbumImage.url,
            }
            console.log("Random Track:", random_track)
            chooseTrack(random_track)
        })()

        return () => {cancel = true}
    }, [myPlaylist, accessToken])


    return(
        <DashboardContainer>
            {Object.keys(myPlaylist).length === 0 ?
                <div>
                <UserNameInput
                    type="search"
                    placeholder="Enter username to get playlists"
                    value={username}
                    onChange={e => setUserName(e.target.value)}
                />                
                <ResultsContainer>
                {username ?           
                <TitleText>Playlists for username: {username}</TitleText>
                : null}
                    {myPlaylists.map(playlist => (
                        <PlaylistSearchResult
                            playlist={playlist}
                            key={playlist.uri}
                            choosePlaylist={choosePlaylist}
                        />
                    ))}
                </ResultsContainer>
                </div>
            : null}
            {username && Object.keys(myPlaylist).length > 0 ?            
                <div>
                <TitleText>You selected {myPlaylist.title} playlist</TitleText>
                <SearchInput
                    type="search"
                    placeholder="Search Songs/Artists"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <ResultsContainer>
                    {searchResults.map(track => (
                        <TrackSearchResult
                            track={track}
                            key={track.uri}
                            checkGuess={checkGuess}
                        />
                    ))}
                    <LyricsContainer>{lyrics}</LyricsContainer>
                </ResultsContainer>
                <PlayerContainer>
                    <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
                </PlayerContainer>
                </div>            
            : null}
            
        </DashboardContainer>
    )
}

export default Dashboard