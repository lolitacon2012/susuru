import HookController from './hook';
import Scheduler from './scheduler';
import VdomController from './vdom';

const scheduler = new Scheduler();
const hookController = new HookController();
const vdom = new VdomController(scheduler, hookController);

const createElement = vdom.createElement;
const render = vdom.render;
const renderToString = vdom.renderToString;

const resetVdom = vdom.reset;

// Hooks
const useState = hookController.useState;
const useEffect = hookController.useEffect;
const useStore = hookController.useStore;
const useRouterRegister = hookController.useRouterRegister;
const useRouter = hookController.useRouter;

export { createElement, render, renderToString, resetVdom, useRouterRegister, useRouter, useState, useEffect, useStore };