export async function POST(req){
  let descricao='elegant nails'
  try{
    const body=await req.json()
    descricao=body.descricao||descricao

    const prompt=`professional nail art close-up photo, ${descricao}, perfectly manicured nails, studio lighting, sharp focus, high resolution, neutral background, beauty photography`

    // Tenta Hugging Face FLUX.1-schnell
    const hfRes=await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({inputs:prompt,parameters:{width:512,height:512,num_inference_steps:4}})
      }
    )

    if(hfRes.ok&&hfRes.headers.get('content-type')?.includes('image')){
      const buffer=await hfRes.arrayBuffer()
      const b64=Buffer.from(buffer).toString('base64')
      return Response.json({ok:true,imageData:`data:image/jpeg;base64,${b64}`,prompt})
    }

    throw new Error('HF indisponível')

  }catch(e){
    // Fallback confiável: Pollinations flux-realism
    const p=`professional nail art close-up, ${descricao}, studio lighting, sharp focus, high quality manicure`
    const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?model=flux-realism&width=512&height=512&nologo=true&seed=${Date.now()}`
    return Response.json({ok:true,imageData:url,prompt:p})
  }
}
