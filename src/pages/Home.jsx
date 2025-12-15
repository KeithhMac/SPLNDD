import { IntroSection } from "./IntroSection";
import { ServiceSection } from "./ServiceSection";
import { HomeSec1 } from "./HomeSec1";
import { HomeNewArrivals } from "./HomeNewArrivals";

export const Home = () => {
  return (
    <div className="flex flex-col gap-[2.1rem]">
      <IntroSection />
      <ServiceSection />
      <HomeNewArrivals />
      <HomeSec1 />

    </div>
  );
};
