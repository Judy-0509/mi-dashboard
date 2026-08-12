type SelectedStackOutlineInput = {
  selected: boolean
  x: number
  y: number
  width: number
  parentY: number
  parentHeight: number
}

export function getSelectedStackOutline({
  selected,
  x,
  y,
  width,
  parentY,
  parentHeight,
}: SelectedStackOutlineInput) {
  const inset = 1
  const height = parentY + parentHeight - y

  if (
    !selected ||
    ![x, y, width, parentY, parentHeight].every(Number.isFinite) ||
    width <= inset * 2 ||
    height <= inset * 2
  ) {
    return null
  }

  return {
    x: x + inset,
    y: y + inset,
    width: width - inset * 2,
    height: height - inset * 2,
  }
}
