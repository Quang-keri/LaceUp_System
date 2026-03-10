import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";

import image1 from "../../assets/apex s1.png";
import image2 from "../../assets/bata.png";
import image3 from "../../assets/lotto.png";

import "./MainSlider.css";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const MainSlider2 = () => {
  const datas = [
    {
      img: image1,
      classStrock: "bongda-strock",
      classFill: "bongda-text",
    },
    {
      img: image2,
      classStrock: "caulong-strock",
      classFill: "caulong-text",
    },
  ];

  return (
    <Carousel
      renderArrowPrev={(clickHandler) => (
        <button
          onClick={clickHandler}
          className="absolute left-5 top-1/2 -translate-y-1/2 z-50 text-shadow-black text-3xl"
        >
          <FaChevronLeft />
        </button>
      )}
      renderArrowNext={(clickHandler) => (
        <button
          onClick={clickHandler}
          className="absolute right-5 top-1/2 -translate-y-1/2 z-50 text-shadow-black text-3xl"
        >
          <FaChevronRight />
        </button>
      )}
      showThumbs={true}
      swipeable={true}
      autoPlay={true}
      infiniteLoop={true}
      showStatus={false}
      useKeyboardArrows={true}
    >
      {datas.map((data, i) => (
        <div key={i}>
          <img src={data.img} alt="Slide" className="z-[10]" />

          <div className={data.classFill}></div>
          <div className={data.classStrock}></div>

          <div className="flex absolute top-[61.5%] right-[180px] text-xl gap-1 text-[#cf9c5d]">
            <AiFillStar />
            <AiFillStar />
            <AiFillStar />
            <AiFillStar />
            <AiOutlineStar />
          </div>
        </div>
      ))}
    </Carousel>
  );
};

export default MainSlider2;
