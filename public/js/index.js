const categorys = document.querySelectorAll(".catElement");

categorys.forEach((category) => {
  category.addEventListener("click", () => {
    removeActCat();
    category.classList.add("active");
  });
});

function removeActCat() {
  categorys.forEach((category) => {
    category.classList.remove("active");
  });
}
