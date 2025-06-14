
import '../pages/Home.css'
import MapComponent from "../components/MapComponent";
import AdminLogin from "../components/AdminLogin";
const Home = () => {
    return (
        <div className="home-c">
            {<AdminLogin/>}
            <MapComponent />
        </div>
    )
}

export default Home