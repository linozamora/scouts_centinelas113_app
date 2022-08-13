import React, { useState, useRef, useEffect } from 'react'
import { View, StyleSheet, TextInput, TouchableOpacity, Image, Text, ImageBackground, Alert } from 'react-native'
import { Button, IconButton, Subheading, ProgressBar, Card, Avatar } from 'react-native-paper'
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Picker } from '@react-native-picker/picker';
import ImagePicker from 'react-native-image-picker'
import { imagePickerOptions } from '../../Utils';
import RBSheet from "react-native-raw-bottom-sheet";
import storage from '@react-native-firebase/storage';
import { useUploadImagePreRegister } from '../../Hooks'
import { FlatList, ScrollView } from 'react-native-gesture-handler';
import PickerCheckBox from 'react-native-picker-checkbox';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Header } from 'react-native-elements';


export default function CreatePublication({ navigation }) {

    //Declaracion de Variable para Imagen predeterminada de publicacion (Gris)
    /*const {imageName} = this.state;
    let imageRef = firebase.storage().ref('/' + 'Img_Predeterminada_Publicacion.png');
    imageRef
    .getDownloadURL()
    .then((url) => {
        //from url you can fetched the uploaded image easily
        this.setState({profileImageUrl: url});
    })
    .catch((e) => console.log('getting downloadURL of image error => ', e));*/

    const {imagen} = <Image source={require('../../Images/Img_Predeterminada_Publicacion.png')} />

    //Declaracion de variables
    const [{ downloadURL, uploading, progress }, monitorUpload] = useUploadImagePreRegister();
    //const LeftContent = props => <Avatar.Icon {...props} icon="account-circle" />
    const [imageLocal, setImageLocal] = useState();
    const [date, setDate] = useState(new Date());
    //const [checkedItem, setICheckedItem] = useState();
    const refRBSheet = useRef();
    const tomarFotoCamara = () => {
        refRBSheet.current.close()
        ImagePicker.launchCamera(imagePickerOptions, response => {
            const { didCancel, error } = response;
            if (didCancel) {
            } else {
                monitorUpload(response)

                setImageLocal(response.uri)
            }
        })
    }

    const mostrarfotoGalaria = () => {
        refRBSheet.current.close()
        ImagePicker.launchImageLibrary(imagePickerOptions, response => {
            const { didCancel, error } = response;
            if (didCancel) {
            } else {
                monitorUpload(response)
                setImageLocal(response.uri)
            }
        })
    }

    const user = auth().currentUser

    const handleConfirm = (pItems) => {
        //setICheckedItem(pItems);
        var name = "checkedItem";
        setPublicar({ ...publicar, [name]: pItems })
    }

    const cItems = {};
    const [state, setState] = useState({
        doc_id: "",
        nombres: "",
        apellidos: "",
        correo: "",
        rol: "",
        grupo: "",
        url: ""
    })

    const [publicar, setPublicar] = useState({
        titulo: "",
        cuerpo: "",
        checkedItem: [],
        destinatario: "",
        date: date
    })

    const [destinatarios, setDestinatarios] = useState([{ itemKey: '', itemDescription: '' }]);

    //Obtener datos de firestore
    useEffect(() => {
        //DESTINATARIOS
        firestore()
            .collection('Grupo')
            .orderBy('nombre')
            .get()
            .then(querySnapshot => {
                let grupo
                let datosRamas = []
                for (let i = 0; i < querySnapshot.size; i++) {
                    grupo = querySnapshot.docs[i].data();
                    datosRamas.push({ itemKey: i, itemDescription: grupo.nombre });
                }
                setDestinatarios(datosRamas);
            });
    }, [])

    const handleChangeText = (name, value) => {
        setPublicar({ ...publicar, [name]: value })
        //setState({ ...state, [name]: value })
    }

    const saveNewPublication = async () => {
        let error = true
        if (publicar.titulo === '' || publicar.cuerpo === '' || publicar.checkedItem.length === 0) {
            alert('Complete todos los campos')
        } else {
            var destina = '';
            publicar.checkedItem.map((itemCheck) => {
                destina = destina + itemCheck.itemDescription + ',';
            });

            await firestore().collection('Publication').add({
                id: user.uid,
                titulo: publicar.titulo,
                cuerpo: publicar.cuerpo,
                destinatario: destina, //itemCheck.itemDescription,
                url: downloadURL || 'https://firebasestorage.googleapis.com/v0/b/centinela-8b7ed.appspot.com/o/PreRegister%2FImg_Predeterminada_Publicacion.png?alt=media&token=20c6f2a0-2e0c-4c5e-8bde-65cf9854e744',
                date: date
            }).then(() => {
                error = false
            });

            //alert('Datos Guardados Correctamente')
        }
        if (!error) {

            Alert.alert(
                null,
                'Mensaje creado correctamente',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Home')
                    },
                ],
                { cancelable: false },
            );
        }
    }

    return (
        <View style={styles.container}>
            <Header
                containerStyle={{
                    backgroundColor: '#b31d1d',
                    justifyContent: 'space-around',
                }}
                //leftComponent={{ icon: 'reply', color: '#fff', }}
                leftComponent={<Icon
                    name='keyboard-backspace'
                    color='#fff'
                    iconStyle={{ fontSize: 27 }}
                    onPress={() => navigation.navigate('Home')}
                />

                }
                centerComponent={{ text: 'MENSAJES', style: { color: '#fff' } }}

            />
            <ImageBackground source={require('../../../assets/imagenes/Login_Background_White.png')} style={{ flex: 1, resizeMode: 'cover', justifyContent: 'center' }}>
                <SafeAreaView>
                    <ScrollView>
                        <Text style={styles.titleText}>PUBLICAR MENSAJE</Text>
                        <View style={styles.body}>
                            <View style={{ marginTop: 10 }}>
                                <View style={{ alignSelf: 'flex-start' }}>
                                    <Button
                                        icon="camera"
                                        color="gray"
                                        uppercase={false}
                                        mode="text"
                                        onPress={() => refRBSheet.current.open()}
                                    >
                                        Tomar o subir una imagen
                                </Button>
                                </View>
                                {uploading && (
                                    <View style={{ paddingHorizontal: 10 }}>
                                        <Text>Subiendo imagen: {parseInt(progress * 100) + '%'}</Text>
                                        <ProgressBar progress={progress} color={'#b10909'} />
                                    </View>
                                )}
                                {downloadURL && (
                                    <Image
                                        source={{ uri: imageLocal }}
                                        style={{ width: 255, height: 200, alignSelf: 'center', marginTop: 15, marginRight: 5 }}
                                    />

                                )}

                            </View>

                            <View style={{ padding: 10 }}>
                                <Text>Titulo</Text>
                                <TextInput
                                    style={styles.inputText}
                                    placeholder='Titulo'
                                    onChangeText={(value) => handleChangeText("titulo", value)}
                                />
                            </View>
                            <View style={{ padding: 10 }}>
                                <Text>Destinatarios</Text>
                                <View style={styles.inputGroup}>
                                    <PickerCheckBox
                                        data={destinatarios}
                                        headerComponent={<Text style={{ fontSize: 20 }} >Destinatarios</Text>}
                                        OnConfirm={(pItems) => handleConfirm(pItems)}
                                        ConfirmButtonTitle='Ok'
                                        DescriptionField='itemDescription'
                                        KeyField='itemKey'
                                        placeholder='Seleccionar...'
                                        placeholderSelectedItems='$count selected item(s)'
                                    />
                                </View>
                            </View>
                            <View style={{ padding: 10 }}>
                                <Text>Mensaje</Text>
                                <ScrollView>
                                    <TextInput
                                        style={styles.areaText}
                                        row={5}
                                        multiline={true}
                                        numberOfLines={8}
                                        maxLines={10}
                                        placeholder='Descripción del mensaje'
                                        onChangeText={(value) => handleChangeText("cuerpo", value)}
                                    />
                                </ScrollView>
                            </View>
                            <View style={{ padding: 10 }}>
                                <Button icon="floppy" color="#fff" uppercase={false} style={styles.roundButton}
                                    onPress={() => saveNewPublication()}>Guardar</Button>
                            </View>
                            <View style={{ marginTop: 15 }}></View>
                            <RBSheet
                                ref={refRBSheet}
                                closeOnDragDown={true}
                                closeOnPressMask={false}
                                height={180}
                                customStyles={{

                                    wrapper: {
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                    },
                                    draggableIcon: {
                                        backgroundColor: '#ffc604'
                                    }
                                }}
                            >
                                <View >
                                    <TouchableOpacity
                                        onPress={tomarFotoCamara}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}>
                                        <IconButton
                                            icon='camera'
                                        />
                                        <Subheading>Tomar foto</Subheading>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={mostrarfotoGalaria}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <IconButton
                                            icon='image-multiple'
                                        />
                                        <Subheading>Seleccionar de galería</Subheading>
                                    </TouchableOpacity>

                                </View>
                            </RBSheet>

                        </View>
                    </ScrollView  >
                </SafeAreaView>
            </ImageBackground>
        </View>
    )
}

const styles = StyleSheet.create({
    body: {
        width: '85%',
        alignContent: 'center',
        alignSelf: 'center',
        backgroundColor: '#e8e8e8',
        borderRadius: 8,
        borderWidth: 0.5
    },
    container: {
        flex: 1,
        flexDirection: 'column',
    },

    inputGroup: {
        width: '100%',
        backgroundColor: 'white',
        height: 45,
    },
    areaText: {
        width: '100%',
        backgroundColor: 'white',
        alignSelf: 'center',
        textAlignVertical: 'top',
    },
    inputText: {
        height: 40,
        backgroundColor: '#fff'
    },
    titleText: {
        alignSelf: 'center',
        padding: 20,
        fontSize: 25,
        fontWeight: 'bold'
    },
    roundButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#b31d1d',
    },
    pickerContainerStyle: {
        backgroundColor: '#b31d1d',
    },
})
