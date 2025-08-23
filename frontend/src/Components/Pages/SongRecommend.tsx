import { useState } from "react";
import NavBar from "../Templates/Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";

interface RecommendProps {

}

const SongRecommend = (props: RecommendProps) => {

    const navigate = useNavigate();
    const [title, setTitle] = useState<string>("");
    const [artist, setArtist] = useState<string>("");
    const [lyric, setLyric] = useState<string>("");
    

    useEffect(() => {
        axios({
            method: "GET",
            url: "http://localhost:8000/songLyric",
            withCredentials: true,
        }).then((res) => {
            const {Title} = res.data.songData;
            const {Artist} = res.data.songData;
            const {Lyric} = res.data.songData;
            const lyricData = JSON.stringify(Lyric).replace("\n", "<br/>");
            console.log(res.data.songData)
            setTitle(Title);
            setArtist(Artist);
            setLyric(lyricData);
        }).catch((err) => {
            console.error("Error fetching Lyrics data: ", err);
        });
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB]">
            <div className="h-[calc(100vh-80px)] p-0 px-3 w-full max-w-[440px] box-border mx-auto overflow-y-scroll">
                {/* 뒤로가기 버튼 */}
                <div className="py-6" onClick={() => {navigate("/home")}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                        <path d="M14.2969 23.4375L5.85938 15L14.2969 6.5625M7.03125 15H24.1406" stroke="black" strokeWidth="2.8125" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="flex flex-col">
                    <div>
                        {/* YouTube container */}
                    </div>
                    <div className="w-full bg-[#00daaa]">
                        <div className="p-[10px_20px] text-[22px] font-bold">
                            {title}
                        </div>
                        <div className="p-[10px_20px] text-[18px]">
                            {artist}
                        </div>
                    </div>
                    <span className="whitespace-pre-wrap p-3">
                        <span>{lyric}</span>
                    </span>
                </div>
            </div>
            <NavBar currentPage={"Home"} />
        </div>
    );
}


export default SongRecommend;