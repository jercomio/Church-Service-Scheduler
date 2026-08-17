## 1. Contexte

Pouvoir établir et maintenir un planning de service pour les membres d’une équipe au sein d’une église.

Par exemple, dans le service vidéo, il y a une équipe de 2 personnes qui se partage le service le dimanche matin pour le culte et le mercredi soir pour l’étude biblique.

## 2. Objectif

On se propose de développer une application web responsive PWA permettant de planifier les jours de service le dimanche matin et le mercredi soir.

## 3. Recommandations

- L’application doit être intuitive, *user friendly*, orienté utilisateur avec un design moderne et soigné.
- L’application doit parfaitement s’adapter sur mobile et tablette comme sur ordinateur.
- L’application doit intégrer les recommandations d’accessibilité et respecter les standards du web (W3C).
- Le code doit être propre, bien structuré (*clean code*).

## 4. Stack technique

- React Native (iOS + Android)
- TailwindCSS
- TypeScript
- Supabase, Supabase Auth
- Prisma (ORM)
- UI : Shadcn/ui → base UI ; icônes → privilégier *lucide-react (*https://lucide.dev/icons/*)*

## 5. Particularités

1. **Adapter Pattern pour les composants UI**
    
    Éviter d’utiliser les composants d’une librairie UI directement. Utiliser plutôt des Adapters Pattern afin de pouvoir changer de librairie facilement.
    
    Ces patterns sont particulièrement utiles lorsqu’on souhaite changer d’*UI system* sans avoir à modifier tout le code où se trouve ces composants.
    
    Par exemple, si on a :
    
    ```tsx
    // ui/Button.tsx
    import { ShadcnButtonAdapter } from "./adapters/ShadcnButtonAdapter";
    // import { MuiButtonAdapter } from "./adapters/MuiButtonAdapter";
    
    const adapter = new ShadcnButtonAdapter();
    // const adapter = new MuiButtonAdapter(); // switch ici
    
    export function Button(props: ButtonProps) {
      return adapter.render(props);
    }
    ```
    
    On remplace par :
    
    ```tsx
    const adapter = new MuiButtonAdapter();
    ```
    
    Ainsi, on est passé des composants Shadcn/ui à MUI.
    
    ### Exemple complet
    
    ### a. Interface stable
    
    ```tsx
    // ui/Button.types.ts
    export interface ButtonProps {
      children: React.ReactNode;
      variant?: "primary" | "secondary" | "ghost";
      disabled?: boolean;
      onClick?: () => void;
    }
    ```
    
    ### b. Adapter Shadcn
    
    ```tsx
    // ui/adapters/ShadcnButtonAdapter.tsx
    import { Button as ShadcnButton } from "@/components/ui/button";
    import { ButtonProps } from "../Button.types";
    
    export class ShadcnButtonAdapter {
      render(props: ButtonProps) {
        return (
          <ShadcnButton
            variant={props.variant}
            disabled={props.disabled}
            onClick={props.onClick}
          >
            {props.children}
          </ShadcnButton>
        );
      }
    }
    ```
    
    ### c. Adapter MUI
    
    ```tsx
    // ui/adapters/MuiButtonAdapter.tsx
    import Button from "@mui/material/Button";
    import { ButtonProps } from "../Button.types";
    
    export class MuiButtonAdapter {
      render(props: ButtonProps) {
        return (
          <Button
            variant={props.variant === "primary" ? "contained" : "text"}
            disabled={props.disabled}
            onClick={props.onClick}
          >
            {props.children}
          </Button>
        );
      }
    }
    ```
    
    ### d. Le composant stable utilisé dans l’app
    
    ```tsx
    // ui/Button.tsx
    import { ShadcnButtonAdapter } from "./adapters/ShadcnButtonAdapter";
    // import { MuiButtonAdapter } from "./adapters/MuiButtonAdapter";
    
    const adapter = new ShadcnButtonAdapter();
    // const adapter = new MuiButtonAdapter(); // switch ici
    
    export function Button(props: ButtonProps) {
      return adapter.render(props);
    }
    ```
    
    ### e. Utilisation dans l’application
    
    ```tsx
    <Button variant="primary">Valider</Button>
    ```
    

1. **Manifeste des URLs**
    
    Mettre en place une *liste blanche* des URLs qui peuvent être consultées par l’utilisateur. Ainsi, cela garantie que si une URL ne faisant pas partie de cette liste blanche est requêtée alors un message d’erreur sera renvoyé à l’utilisateur.
    
2. **API**
    
    Pour construire une API REST notamment, penser au versioning de cette API.
    
3. **Clean Architecture**
    
    Adopter une *clean architecture* de sorte à pouvoir changer de service ORM et/ou de *database* sans toucher le code source.
    
4. **Features flags**
    
    → Pour chaque fonctionnalité, spécifier dans la table correspondante une colonne `enabled`:`boolean` 
    
    → Chaque fonctionnalité est associé à un `userId` afin de spécifier si telle ou telle fonctionnalité est active pour tel ou tel utilisateur.
    
    → Chaque fonctionnalité est aussi fonction du *pricing* qui active ou désactive certaines *features*.
    