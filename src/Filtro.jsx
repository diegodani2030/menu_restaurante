function Filtro ({ categoria, setcategoria}) {
    return (
        <div className="filtros">
            <button className={categoria === "Todas" ? "activo" : ""}
            onClick={() => setcategoria("Todas")}>Todas</button>
            <button className={categoria === "Entrada" ? "activo" : ""}
            onClick={() => setcategoria("Entrada")}>Entradas</button>
            <button className={categoria === "Plato fuerte" ? "activo" : ""}
             onClick={() => setcategoria("Plato fuerte")}>Platos fuertes</button>
            <button className={categoria === "Postre" ? "activo" : ""}
             onClick={() => setcategoria("Postre")}>postres</button>
        </div>
    )
}

export default Filtro