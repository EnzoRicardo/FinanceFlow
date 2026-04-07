import "./categories.css"
import SideBar from "../../components/sideBar"
import CategoriesPanel from "../../components/categoriesPanel"

export default function CategoriesPage() {
  return (
    <div className="home-container">
      <div className="home-left">
        <SideBar />
      </div>

      <div className="home-mid-categories">
        <CategoriesPanel />
      </div>
    </div>
  )
}

