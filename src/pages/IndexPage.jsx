/** @format */

import { Outlet, useLoaderData } from "react-router-dom";

import NavigationView from "../components/navs/NavigationView";

const IndexPage = () => {
  const loaderData = useLoaderData() || {};
  const { user } = loaderData;

  return (
    <NavigationView user={user}>
      <Outlet />
    </NavigationView>
  );
};

export default IndexPage;
