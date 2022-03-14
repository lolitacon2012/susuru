import VdomController from './vdom';

// Vdom controller has all hooks
const vdom = new VdomController();
const createElement = vdom.createElement;
const mount = vdom.render;
const reRender = vdom.reRender;
const useState = vdom.hookController?.useState;
const useMounted = vdom.hookController?.useMounted;
export { createElement, mount, reRender, useState, useMounted };