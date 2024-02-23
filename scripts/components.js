$(".component").each((_index, component) => $(component).load(`components/${component.id}.html`));

firebase.auth().onAuthStateChanged(user => {
  const state = user ? 'authenticated' : 'unauthenticated';
  $("#navbar").load(`components/navbar/${state}.html`);
});
