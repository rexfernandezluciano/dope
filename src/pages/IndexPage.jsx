/** @format */

import { Outlet } from "react-router-dom";

import NavigationView from "../components/navs/NavigationView";

const IndexPage = () => {
  return (
    <NavigationView>
      <Outlet />
    </NavigationView>
  );
};

export default IndexPage;
