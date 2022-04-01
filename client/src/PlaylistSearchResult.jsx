import React from "react"

import {
    ResultContainer,
    ResultImage,
    SongContainer,
    TitleText,
    ArtistText,
} from "./styles/TrackSearchResults.styles"

const PlaylistSearchResult = ({ playlist, choosePlaylist }) => {
    function selectPlaylist() {
        choosePlaylist(playlist)
    }

    return (
        <ResultContainer onClick={selectPlaylist}>
            <ResultImage src={playlist.image} />
            <SongContainer>
                <TitleText>{playlist.title}</TitleText>
                <ArtistText>{playlist.description}</ArtistText>
            </SongContainer>
        </ResultContainer>
    )
}

export default PlaylistSearchResult