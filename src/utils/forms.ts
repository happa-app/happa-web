// Enviar un formulario a una acción del servidor SIN que React lo vacíe al terminar.
//
// Con <form action={...}>, React 19 "resetea" el formulario cuando acaba la acción, aunque haya ido mal.
// En los formularios cuyos campos guarda React (con useState), las casillas, las opciones y los
// desplegables volverían a verse como al principio, mientras por dentro siguen como los dejó la persona:
// lo que se ve y lo que se envía dejarían de coincidir. Enviando desde onSubmit no se resetea nada.
//
// Uso: <form onSubmit={submitWithoutReset(formAction)}> (formAction es el de useActionState)
import { startTransition, type FormEvent } from "react";

export function submitWithoutReset(dispatch: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };
}
