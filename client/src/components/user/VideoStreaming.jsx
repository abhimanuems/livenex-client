import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  BsFillMicMuteFill,
  BsCameraVideoOffFill,
  BsFacebook,
  BsYoutube,
  BsFillEyeFill,
} from "react-icons/bs";
import {
  AiFillVideoCamera,
  AiFillCloseCircle,
  AiFillLike,
  AiOutlineLike,
} from "react-icons/ai";
import { MdScreenShare } from "react-icons/md";
import { GoUnmute } from "react-icons/go";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import {
  useFacebookGetCommentsMutation,
  useYoutubeCommentsMutation,
  usePostYTCommentMutation,
  useRtmpUrlYoutubeMutation,
  useRtmpUrlFBMutation,
  useYTviewCountMutation,
  useFBviewCountMutation,
  useDeleteRTMPURLSMutation,
} from "../../slices/userApiSlice.js";
import { useDispatch } from "react-redux";
import { clearRTMPURLS } from "../../slices/userDetails.js";
import Chat from "../user/Chat.jsx"
import useInterval from "../../utilis/useInterval.js";

const VideoStreaming = () => {
  const videoRef = useRef(null);
  const intervalIdRef = useRef(null);
  const [fbcomments] = useFacebookGetCommentsMutation();
  const [youTubeComments] = useYoutubeCommentsMutation();
  const [confirmButton, setConfirmButton] = useState(false);
  const [isCameraActive, setCameraActive] = useState(false);
  const [ismute, setMute] = useState(true);
  const [stopCam, setCam] = useState(true);
  const [isShareScreen, SetShareScreen] = useState(false);
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [rtmpUrlFb, setRtmpFb] = useState(null);
  const [rtmpurlYoutube, setyoutubeRTMP] = useState(null);
  const [fbliveComments, setFbLiveComments] = useState(null);
  const [ytLivecomments, setYTliveComment] = useState(null);
  const { userDetails } = useSelector((state) => state.userDetails);
  const dispatch = useDispatch();
  const [comment, setComment] = useState("");
  const [YTpostComment] = usePostYTCommentMutation();
  const [rtmpYoutube] = useRtmpUrlYoutubeMutation();
  const [RTMPFB] = useRtmpUrlFBMutation();
  const [isActive, setActive] = useState(false);
  //const viewCountTimer = 50000;
  const [viewCountTimer, setviewCountTimer] = useState(5000);
  const [YTviewCount] = useYTviewCountMutation();
  const [FBviewCount] = useFBviewCountMutation();
  const [youtubeViewCount, setYTViewCount] = useState(0);
  const [fbviewCount, setfbviewCount] = useState(0);
  const [YTLikeCount, setYTlikeCount] = useState(0);
  const [YTstats, setYTstats] = useState(false);
  const [FBstats, setFbstats] = useState(false);
  const [deleteRTMPURLS] = useDeleteRTMPURLSMutation();
  useEffect(() => {
    // setRTMPUrls();
    const getRTMPYTFB = async () => {
      const rtmpurlYT = await rtmpYoutube().unwrap();
      if (rtmpurlYT == null) {
        getRTMPYTFB();
      } else {
        setyoutubeRTMP(rtmpurlYT);
      }
      const rtmpFBURL = await RTMPFB().unwrap();
      if (rtmpFBURL == null) {
        getRTMPYTFB();
      } else {
        setRtmpFb(rtmpFBURL);
      }
    };
    getRTMPYTFB();
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  useInterval(() => {
    if (isActive && rtmpUrlFb) {
      setviewCountTimer(10000);
      getFbComments();
    }
    if (isActive && rtmpurlYoutube) {
      setviewCountTimer(50000);
      YTcomments();
    }
  }, viewCountTimer);

  const youtubeLiveViewCount = async () => {
    const YTviewCounts = await YTviewCount().unwrap();
    setYTViewCount(YTviewCounts.viewCountYT);
    setYTlikeCount(YTviewCounts.likes);
  };

  const facebookViewCount = async () => {
    const FBviewCounts = await FBviewCount().unwrap();
    setfbviewCount(FBviewCounts.count);
  };

  const showYTstats = () => {
    youtubeLiveViewCount();
    setYTstats(!YTstats);
  };
  const showFBstats = () => {
    facebookViewCount();
    setFbstats(!FBstats);
  };

  const getFbComments = async () => {
    try {
      const fbcomment = await fbcomments().unwrap();
      const dataArray = fbcomment.facebookMessage.data.map((item) => ({
        name: item.from.name,
        message: item.message,
      }));
      setFbLiveComments(dataArray);
    } catch (err) {
      console.error(err.message);
      toast.error(err.message);
    }
  };

  const YTcomments = async () => {
    try {
      const YTComment = await youTubeComments().unwrap();
      console.log(YTComment);
      const extractedData = YTComment?.response.map((item) => ({
        displayMessage: item.snippet.displayMessage,
        displayName: item.authorDetails.displayName,
      }));
      console.log("extractedData", extractedData);
      setYTliveComment(extractedData);
      console.log(ytLivecomments);
    } catch (err) {
      console.error(err.message);
    }
  };

  const setRTMPUrls = () => {
    console.log("facebook", userDetails?.rtmpUrl);
    console.log("youtube us ", userDetails?.rtmpurlYoutube);
    if (userDetails?.rtmpUrl) {
      console.log("enetr at facebook");
      setRtmpFb(userDetails?.rtmpUrl);
    } else {
      alert("facebook is not ser");
    }
    if (userDetails?.rtmpurlYoutube) {
      console.log("neter at the youtube");
      setyoutubeRTMP(userDetails?.rtmpurlYoutube);
    } else {
      alert("youtube is not set");
    }
  };

  const socket = io(io('ws://localhost:3100'), {
    transports: ["websocket"],
    query: {
      rtmpUrlYoutube: rtmpurlYoutube,
      rtmUrlFaceBook: rtmpUrlFb,
    },
  });

  const handleStartRecording = () => {
    if (!socket) {
      toast.error("Socket is not initialized");
      console.error("Socket is not initialized.");
      return;
    }
    // setRTMPUrls();
    recorderInit();
    setActive(true);

    // const youtubeComments = async()=>{
    //  const youtubeComments = await youTubeComments().unwrap();
    //  console.log(youtubeComments);
    // }
    //  if (intervalIdRef.current) {
    //    clearInterval(intervalIdRef.current);
    //  }
    //   intervalIdRef.current = setInterval(()=>{
    //     youtubeComments();
    //     fbcomments();
    //   }, 50000);
  };

  const recorderInit = () => {
    const liveStream = videoRef.current.captureStream(30);

    const mediaRecorder = new MediaRecorder(liveStream, {
      mimeType: "video/webm;codecs=h264",
      videoBitsPerSecond: 3 * 1024 * 1024,
    });

    mediaRecorder.ondataavailable = (e) => {
      socket.send(e.data);
    };
    mediaRecorder.start(1000);
  };

  const getStream = async () => {
    if (stream && videoRef.current) return;

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: ismute,
      video: {
        height: { min: 720, max: 1280 },
        width: { min: 1080, max: 1920 },
        frameRate: { min: 15, ideal: 24, max: 30 },
        facingMode: "user",
      },
    });

    setStream(mediaStream);
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  };

  useEffect(() => {
    getStream();
  }, [videoRef, ismute, stopCam, isShareScreen]);

  const stopRecording = () => {
    if (isCameraActive) {
      if (socket) {
        socket.close();
      }
    }
  };

  const handleToggleCamera = () => {
    setCameraActive(!isCameraActive);

    if (!isCameraActive && stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = false;
      });
    } else if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = true;
      });
    }
  };

  const deleteRTMPURL = async () => {
    await deleteRTMPURLS().unwrap();
  };

  const leaveStudio = () => {
    socket.emit("client-stop-ffmpeg");
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
    clearInterval(intervalIdRef.current);
    stopRecording();
    dispatch(clearRTMPURLS());
    deleteRTMPURL();
    navigate("/");
  };

  const sendComment = async () => {
    if (comment.trim === "") {
      toast.error("Kindly enter a comment");
      alert("shjsjghjh");
      return;
    }
    await YTpostComment({ comment }).unwrap();
    setComment("");
  };

  return (
    <div className="flex h-fit bg-gray-100">
      <div className="w-9/12">
        <div className="flex justify-between">
          {rtmpurlYoutube ? (
            <div className="m-3 ml-4">
              <BsYoutube
                style={{ fontSize: "30px", color: "red", cursor: "pointer" }}
                onClick={showYTstats}
              />
              {YTstats ? (
                <>
                  <div className="flex mt-2">
                    <BsFillEyeFill style={{ fontSize: "20px", color: "red" }} />
                    <p className="ml-2">{youtubeViewCount}</p>
                  </div>
                  <div className="flex mt-2">
                    <AiOutlineLike style={{ fontSize: "20", color: "red" }} />
                    <p className="ml-2 text-red-500">{YTLikeCount}</p>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {rtmpUrlFb ? (
            <div className="m-3 mr-4">
              <BsFacebook
                style={{ fontSize: "30px", color: "blue", cursor: "pointer" }}
                onClick={showFBstats}
              />
              {FBstats ? (
                <>
                  <div className="flex mt-2">
                    <BsFillEyeFill
                      style={{ fontSize: "20px", color: "blue" }}
                    />
                    <p className="ml-2 text-blue-500">{fbviewCount}</p>
                  </div>
                  <div className="flex mt-2">
                    <AiFillLike style={{ fontSize: "20px", color: "blue" }} />
                    <p className="ml-2 text-blue-500">{YTLikeCount}</p>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="w-full h-96 mb-4 pt-7">
          <video
            className="w-full h-96 mb-4"
            ref={videoRef}
            autoPlay
            playsInline
            muted={!isCameraActive} // Mute/unmute based on camera state
          />
        </div>
        <div className="flex justify-center mt-1">
          <div className={`border-2 ${FBstats || YTstats ? "mt-20" : "mt-32"}`}>
            {!ismute ? (
              <button
                className="mx-5 my-2  text-blue-950"
                onClick={() => {
                  setMute(true);
                }}
              >
                <GoUnmute style={{ fontSize: "28px", marginLeft: "10px" }} />
                <p>unmute</p>
              </button>
            ) : (
              <button
                className="mx-5 my-2  text-red-600"
                onClick={() => {
                  setMute(false);
                }}
              >
                <BsFillMicMuteFill
                  style={{ fontSize: "28px", marginLeft: "2px" }}
                />

                <p>Mute</p>
              </button>
            )}

            <button
              className="mx-5 my-2  text-blue-950"
              onClick={handleToggleCamera}
            >
              {isCameraActive ? (
                <AiFillVideoCamera
                  style={{ fontSize: "30px", marginLeft: "14px" }}
                />
              ) : (
                <BsCameraVideoOffFill
                  style={{ fontSize: "30px", marginLeft: "14px" }}
                />
              )}
              <p>{isCameraActive ? "Start cam" : " Stop cam"}</p>
            </button>

            <button
              className="mx-5 my-2  text-blue-950"
              onClick={() => SetShareScreen(true)}
            >
              <MdScreenShare style={{ fontSize: "30px", marginLeft: "22px" }} />
              <p>share Screen</p>
            </button>
            <button className="mx-5 my-2  text-red-800" onClick={leaveStudio}>
              <AiFillCloseCircle
                style={{ fontSize: "30px", marginLeft: "22px" }}
              />
              <p>Leave Studio</p>
            </button>
          </div>
        </div>
      </div>

      <div className="w-3/12 p-4 bg-white">
        <div className="h-1/6">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            onClick={handleStartRecording}
          >
            Go Live
          </button>
          <div className="mt-3">
            <p className="text-slate-500">
              Live viewer's comments show up here
              {rtmpUrlFb ? <p> viewer comments won't show up unless the stream is public on Facebook </p> : null}
            </p>

            <div className="h-72">
              <Chat comments={[fbliveComments, ytLivecomments]} />
            </div>
          </div>
        </div>
        {/* <h2 className="text-2xl font-semibold mb-4 mt-2">Comments</h2> */}
        <div className=" h-4/6 mt-0">
          {/* <div className="flex items-center mb-2"></div> */}
        </div>

        <div className="flex items-center mt-24">
          <input
            type="text"
            placeholder="Type your comment here..."
            className="w-full p-2 border border-gray-300 rounded-l-lg"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
            onClick={sendComment}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoStreaming;
