function Filtro ({ categoria, setcategoria, categorias }) {
    return (
        <div className="filtros">
            <button className={categoria === "Todas" ? "activo" : ""}
            onClick={() => setcategoria("Todas")}>Todas</button>
            {categorias.map((c) => (
                <button key={c.id} className={categoria === c.id ? "activo" : ""}
                onClick={() => setcategoria(c.id)}>{c.nombre}</button>
            ))}
        </div>
    )
}

export default Filtro
