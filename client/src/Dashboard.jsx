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
import { Button, Modal, Navbar, Container } from "react-bootstrap"

import {CopyToClipboard} from "react-copy-to-clipboard"

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
    const[guessedCorrectly, setGuessedCorrectly] = useState(1)
    const[isOpen, setIsOpen] = useState(false)
    const[shareText, setShareText] = useState("")
    const[copied, setCopied] = useState(false)
    const[guessList, setGuessList] = useState([])

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
        setGuessedCorrectly(0)
        setShareText("")
        setCopied(false)
        setGuessList([])
    }

    function addToGuessList(track) {
        setGuessList(guessList.concat(track))
    }

    function checkGuess(guessTrack) {
        console.log(guessedCorrectly)
        if (guessedCorrectly) return
        if(guessTrack.uri === playingTrack.uri) {
            console.log("# of tries to guess correctly:", myGuesses + 1)
            setGuessedCorrectly(1)
            console.log("Guessed correctly:", guessedCorrectly)
            toggleModal()
            let text = ""
            for(let i = 0; i < myGuesses; i++) {
                text += "❌"
            }
            text += "✔️\n" + "I guessed " + playingTrack.title + " by " + playingTrack.artist + " in " + `${myGuesses+1}` + " guess(es).\r\nFind out how well you know your playlists too at https://sportdle-react.herokuapp.com/"
            setShareText(text)
            // setShareText(`I guessed ${playingTrack.title} in ${myGuesses+1} guess(es)!\r\nPlay Sportdle at https://sportdle-react.herokuapp.com/`)
        }
        setMyGuesses(myGuesses + 1)
        addToGuessList(guessTrack)
        console.log("Search results", searchResults)
        console.log(guessList)
    }

    function toggleModal() {
        setIsOpen(!isOpen)
    }

    function closeModal() {
        console.log("Close modal!")
        choosePlaylist([])
        toggleModal()
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
            <Navbar bg="#000000" variant="dark">
                <Navbar.Brand style={{"color": '#1db954', "font-size": '300%'}}>
                    {/* <img
                    alt=""
                    src="../public/logo-32x32.png"
                    width="32"
                    height="32"
                    className="d-inline-block align-top"
                    /> */}
                   Sportdle
                </Navbar.Brand>
            </Navbar>
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
                    <TitleText>You have used {myGuesses} guesses.</TitleText>
                    {guessList ? Object.keys(guessList).map(key => (
                            <TitleText>{playingTrack.uri === guessList[key].uri ? "✔️" : "❌"} {guessList[key].title} by {guessList[key].artist}</TitleText>
                    )):null}
                    {searchResults.map(track => (
                        <TrackSearchResult
                            track={track}
                            key={track.uri}
                            checkGuess={checkGuess}
                        />
                    ))}
                    {/* <LyricsContainer>{lyrics}</LyricsContainer> */}
                </ResultsContainer>
                
                <PlayerContainer>
                    <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
                </PlayerContainer>
                </div>            
            : null}
            {guessedCorrectly && isOpen?
                <Modal show={isOpen} onHide={closeModal}>
                    <Modal.Header closeButton>
                    <Modal.Title>You won!</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>You guessed correctly in {myGuesses} {myGuesses > 1 ? "guesses." : "guess."}</Modal.Body>
                    <Modal.Footer>
                    {copied ? <span style={{color: 'red'}}>Copied!</span> : null}
                    {/* <CopyToClipboard text={`I guessed my song correctly in ${myGuesses} guess(es).`} onCopy={() => setCopied(true)}> */}
                    <CopyToClipboard text={shareText} onCopy={() => setCopied(true)}>
                        <Button variant="primary">
                            Share results!
                        </Button>
                    </CopyToClipboard>
                    <Button variant="success" onClick={closeModal}>
                        Close
                    </Button>

                    </Modal.Footer>
                </Modal>
            :null            }
        </DashboardContainer>
    )
}

export default Dashboard