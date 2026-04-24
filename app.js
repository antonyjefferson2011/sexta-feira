let materias = JSON.parse(localStorage.getItem("materias")) || [];

function salvar() {
  localStorage.setItem("materias", JSON.stringify(materias));
}

function criarMateria() {
  let nome = prompt("Nome da matéria:");
  if (!nome) return;

  let autor = localStorage.getItem("nomeUsuario");

  if (!autor) {
    autor = prompt("Seu nome:");
    if (!autor) return;
    localStorage.setItem("nomeUsuario", autor);
  }

  materias.push({
    nome,
    autor
  });

  salvar();
  render();
}

function render() {
  let lista = document.getElementById("lista");
  lista.innerHTML = "";

  materias.forEach(m => {
    lista.innerHTML += `
      <div class="materia">
        <h3>${m.nome}</h3>
        <small>Criado por: ${m.autor}</small>
      </div>
    `;
  });
}

render();
