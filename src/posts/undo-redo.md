---
layout: post.webc
title: How to code a drawing undo/redo feature
tags: draft
description: "An undo/redo drawing feature from scratch, step by step and with a really cool and innovative bonus"
date: 2024-03-12
image: 
    path: assets/img/undo-redo/thumbnail.png
    alt: undo / redo thumbnail

---

The principle is well known so there's no need to describe it. Let's just remember that we're in the special environment of an SVG editor, and that undo/redo operations to the modifications of graphical entities, lines, circles, paths, etc.

## Drawing action

If you want to undo a modification to a graphical entity, you must of course have stored the entity's state before the modification. And if you want to restore an undone modification, you must first have stored the entity's modified state.

Let's set up a **DrawingAction** class designed to store the modification of an entity, i.e. both its "**prevState**" state before modification and its "**nextState**" state after modification. We also store "**entity**", a pointer to the entity itself, so we can change its state right here by applying "**prevState**" or "**nextState**" as appropriate.

```typescript
export class DrawingAction {
    entity: any;
    prevState: any;
    nextState: any;
    status: UndoStateEnum = UndoStateEnum.pending;
}
```

To reverse a state, you need to know "**status**" of the current state. I use a "**UndoStateEnum**" enum that lets me know whether the modification is in progress, undone or restored:

```typescript
export enum UndoStateEnum {
    pending = 0,
    restored,
    undone
}
```

A **DrawingAction** is created when a modification action begins. A service, which we'll see a little later, receives the storage request and generates as many **DrawingActions** as there are selected entities to be modified.

```typescript
export class DrawingAction {
	...
    cudOp: UndoCUDOpEnum;
    
    constructor(e: any, cudOp: UndoCUDOpEnum) { 
        this.entity = e;
        this.cudOp = cudOp;
        this.prevState = this.cloneState(e);
    }
}
```

Le constructeur reçoit l'entité qui est de type any (j'aurais pu lui donner le type de base de mes entités mais j'ai préféré rester générique à ce stade), et "**cudOp**" qui donne le type d'opération CUD (Create, Update, Delete) commencé sur les entités sélectionnées. On a besoin de cette information car ce n'est pas la même chose de rétablir la position d'une entité et de la réinsérée s'il elle a été supprimée ou de la supprimer si elle a été créée.

"**cudOp**" est de type de l'énumération **UndoCUDOpEnum** :

```typescript
export enum UndoCUDOpEnum {
    update = 0,
    create,
    delete
}
```

Le constructeur initialise l'état courant "prevState" avec un clone de l'entité.

```typescript
private cloneState(e: any): any {
    return JSON.parse(JSON.stringify(e));
}
```

"**prevState**" peut sembler un nom assez inapproprié pour désigner l'état courant mais il faut anticiper le fait que lorsqu'on aura fait une opération undo, les deux états "**prevState**" et "**nextState**" auront été échangés et que "**prevState**" correspondra effectivement à l'état précédant l'opération undo.

Pour résumer ce chapitre, voilà la classe **DrawingAction** en entier, elle est très simple :

```typescript
export class DrawingAction {
    entity: any;
    prevState: any;
    nextState: any;
    status: UndoStateEnum = UndoStateEnum.pending;
    cudOp: UndoCUDOpEnum;
    
    constructor(e: any, cudOp: UndoCUDOpEnum) { 
        this.entity = e;
        this.cudOp = cudOp;
        this.prevState = this.cloneState(e);
    }

    push(e: any): boolean {
        this.nextState = this.cloneState(e);
        this.status = UndoStateEnum.restored;
        // return false if the entity has no changes
        return JSON.stringify(this.entity) !== this.nextState;
    }

    undo(): void {
        this.switchState(UndoStateEnum.undone);
    }

    redo(): void {
        this.switchState(UndoStateEnum.restored);
    }

    private switchState(status: UndoStateEnum): void {
        const tmp = this.prevState;
        Object.assign(this.entity, this.prevState);
        this.prevState = this.nextState;
        this.nextState = tmp;
        this.status = status;
    }

    private cloneState(e: any): any {
        return JSON.parse(JSON.stringify(e));
    }
}
```

